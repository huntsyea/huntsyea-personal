import type { RequestFn } from "./github";

/**
 * GitHub's OAuth device flow: the plugin asks GitHub for a short code, the
 * user approves it once in a browser, and the plugin receives a token. No
 * personal access token to create, and OAuth App tokens do not expire.
 */

export type DeviceCode = {
  deviceCode: string;
  userCode: string;
  verificationUri: string;
  /** Seconds until the code expires. */
  expiresIn: number;
  /** Minimum seconds between polls. */
  interval: number;
};

export type DeviceFlowOutcome =
  | { status: "authorized"; token: string }
  | { status: "denied" }
  | { status: "expired" };

/** Enough to write the public site repository and open pull requests. */
export const oauthScope = "public_repo";

export async function requestDeviceCode(
  request: RequestFn,
  clientId: string,
): Promise<DeviceCode> {
  const response = await request({
    url: "https://github.com/login/device/code",
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ client_id: clientId, scope: oauthScope }),
  });
  const body = JSON.parse(response.text) as {
    device_code?: string;
    user_code?: string;
    verification_uri?: string;
    expires_in?: number;
    interval?: number;
    error?: string;
    error_description?: string;
  };

  if (response.status >= 300 || !body.device_code || !body.user_code) {
    throw new Error(
      body.error_description ??
        body.error ??
        `GitHub refused the sign-in request (${response.status}). Check the OAuth App client ID.`,
    );
  }

  return {
    deviceCode: body.device_code,
    userCode: body.user_code,
    verificationUri: body.verification_uri ?? "https://github.com/login/device",
    expiresIn: body.expires_in ?? 900,
    interval: body.interval ?? 5,
  };
}

/**
 * Polls until the user approves or the code expires. `sleep` is injected so
 * tests run instantly; `cancelled` lets the modal abandon the wait.
 */
export async function waitForAuthorization(
  request: RequestFn,
  clientId: string,
  code: DeviceCode,
  sleep: (seconds: number) => Promise<void>,
  cancelled: () => boolean = () => false,
): Promise<DeviceFlowOutcome> {
  let interval = code.interval;
  const deadline = Date.now() + code.expiresIn * 1000;

  while (Date.now() < deadline) {
    await sleep(interval);
    if (cancelled()) return { status: "expired" };

    const response = await request({
      url: "https://github.com/login/oauth/access_token",
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: clientId,
        device_code: code.deviceCode,
        grant_type: "urn:ietf:params:oauth:grant-type:device_code",
      }),
    });
    const body = JSON.parse(response.text) as {
      access_token?: string;
      error?: string;
      interval?: number;
    };

    if (body.access_token) {
      return { status: "authorized", token: body.access_token };
    }
    switch (body.error) {
      case "authorization_pending":
        continue;
      case "slow_down":
        interval = (body.interval ?? interval) + 5;
        continue;
      case "access_denied":
        return { status: "denied" };
      case "expired_token":
        return { status: "expired" };
      default:
        throw new Error(
          `GitHub sign-in failed${body.error ? `: ${body.error}` : ""}.`,
        );
    }
  }

  return { status: "expired" };
}

export async function fetchLogin(
  request: RequestFn,
  token: string,
): Promise<string | undefined> {
  const response = await request({
    url: "https://api.github.com/user",
    method: "GET",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
    },
  });
  if (response.status >= 300) return undefined;
  return (JSON.parse(response.text) as { login?: string }).login;
}
