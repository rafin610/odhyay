import { describe, expect, it } from "vitest";
import { sdk } from "./_core/sdk";

describe("Vercel-compatible Google session payload", () => {
  it("uses a stable application identifier when no Manus app ID is configured", async () => {
    const originalAppId = process.env.VITE_APP_ID;
    delete process.env.VITE_APP_ID;

    try {
      const token = await sdk.createSessionToken("google:reader", { name: "Google Reader", expiresInMs: 60_000 });
      await expect(sdk.verifySession(token)).resolves.toMatchObject({
        openId: "google:reader",
        appId: expect.any(String),
        name: "Google Reader",
      });
    } finally {
      if (originalAppId === undefined) delete process.env.VITE_APP_ID;
      else process.env.VITE_APP_ID = originalAppId;
    }
  });
});
