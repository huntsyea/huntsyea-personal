import type { HttpRequest, HttpResponse } from "@/obsidian-plugin/src/github";

import {
  fetchLogin,
  requestDeviceCode,
  waitForAuthorization,
} from "@/obsidian-plugin/src/auth";

import { describe, expect, it } from "vitest";

const noSleep = async () => {};

function respond(
  handler: (request: HttpRequest, poll: number) => unknown,
): (request: HttpRequest) => Promise<HttpResponse> {
  let polls = 0;
  return async (request) => {
    if (request.url.endsWith("/access_token")) polls += 1;
    return { status: 200, text: JSON.stringify(handler(request, polls)) };
  };
}

describe("GitHub device sign-in", () => {
  it("requests a device code with the public_repo scope", async () => {
    let seen: HttpRequest | undefined;
    const code = await requestDeviceCode(async (request) => {
      seen = request;
      return {
        status: 200,
        text: JSON.stringify({
          device_code: "dev",
          user_code: "ABCD-1234",
          verification_uri: "https://github.com/login/device",
          expires_in: 900,
          interval: 5,
        }),
      };
    }, "client");

    expect(JSON.parse(seen!.body!)).toEqual({
      client_id: "client",
      scope: "public_repo",
    });
    expect(code.userCode).toBe("ABCD-1234");
  });

  it("explains a rejected client id", async () => {
    await expect(
      requestDeviceCode(
        async () => ({
          status: 404,
          text: JSON.stringify({ error: "Not Found" }),
        }),
        "wrong",
      ),
    ).rejects.toThrow("Not Found");
  });

  it("polls until the user approves, honouring slow_down", async () => {
    const request = respond((_, poll) => {
      if (poll === 1) return { error: "authorization_pending" };
      if (poll === 2) return { error: "slow_down", interval: 10 };
      return { access_token: "gho_token" };
    });
    const slept: number[] = [];

    const outcome = await waitForAuthorization(
      request,
      "client",
      {
        deviceCode: "dev",
        userCode: "X",
        verificationUri: "u",
        expiresIn: 900,
        interval: 5,
      },
      async (seconds) => {
        slept.push(seconds);
      },
    );

    expect(outcome).toEqual({ status: "authorized", token: "gho_token" });
    expect(slept).toEqual([5, 5, 15]);
  });

  it("reports denial and expiry", async () => {
    const code = {
      deviceCode: "dev",
      userCode: "X",
      verificationUri: "u",
      expiresIn: 900,
      interval: 1,
    };
    expect(
      await waitForAuthorization(
        respond(() => ({ error: "access_denied" })),
        "c",
        code,
        noSleep,
      ),
    ).toEqual({ status: "denied" });
    expect(
      await waitForAuthorization(
        respond(() => ({ error: "expired_token" })),
        "c",
        code,
        noSleep,
      ),
    ).toEqual({ status: "expired" });
    expect(
      await waitForAuthorization(
        respond(() => ({ error: "authorization_pending" })),
        "c",
        { ...code, expiresIn: 0 },
        noSleep,
      ),
    ).toEqual({ status: "expired" });
  });

  it("stops polling when cancelled", async () => {
    let polls = 0;
    const outcome = await waitForAuthorization(
      async () => {
        polls += 1;
        return {
          status: 200,
          text: JSON.stringify({ error: "authorization_pending" }),
        };
      },
      "c",
      {
        deviceCode: "d",
        userCode: "X",
        verificationUri: "u",
        expiresIn: 900,
        interval: 1,
      },
      noSleep,
      () => true,
    );
    expect(outcome).toEqual({ status: "expired" });
    expect(polls).toBe(0);
  });

  it("reads the signed-in login", async () => {
    expect(
      await fetchLogin(
        async () => ({
          status: 200,
          text: JSON.stringify({ login: "huntsyea" }),
        }),
        "t",
      ),
    ).toBe("huntsyea");
    expect(
      await fetchLogin(async () => ({ status: 401, text: "{}" }), "t"),
    ).toBeUndefined();
  });
});
