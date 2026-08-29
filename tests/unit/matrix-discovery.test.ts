import { GET as getMatrixClientDiscovery } from "@/app/.well-known/matrix/client/route";
import { GET as getMatrixServerDiscovery } from "@/app/.well-known/matrix/server/route";

import { describe, expect, it } from "vitest";

const expectedHeaders = {
  "access-control-allow-origin": "*",
  "cache-control": "public, max-age=3600",
  "content-type": "application/json",
};

function expectDiscoveryHeaders(response: Response) {
  for (const [name, value] of Object.entries(expectedHeaders)) {
    expect(response.headers.get(name)).toBe(value);
  }
}

describe("Matrix discovery", () => {
  it("publishes the client homeserver and MatrixRTC focus", async () => {
    const response = getMatrixClientDiscovery();

    expect(response.status).toBe(200);
    expectDiscoveryHeaders(response);
    await expect(response.json()).resolves.toEqual({
      "m.homeserver": {
        base_url: "https://matrix.huntsyea.com",
      },
      "org.matrix.msc4143.rtc_foci": [
        {
          type: "livekit",
          livekit_service_url: "https://mrtc.huntsyea.com",
        },
      ],
    });
  });

  it("delegates federation to the Synapse endpoint", async () => {
    const response = getMatrixServerDiscovery();

    expect(response.status).toBe(200);
    expectDiscoveryHeaders(response);
    await expect(response.json()).resolves.toEqual({
      "m.server": "matrix.huntsyea.com:443",
    });
  });
});
