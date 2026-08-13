import { describe, expect, it } from "vitest";
import { sdk } from "./_core/sdk";

describe("Manus-compatible session tokens", () => {
  it("creates and verifies the existing session format independently of the Google provider", async () => {
    const token = await sdk.createSessionToken("manus-reader", { name: "Manus Reader", expiresInMs: 60_000 });

    await expect(sdk.verifySession(token)).resolves.toEqual({
      openId: "manus-reader",
      appId: expect.any(String),
      name: "Manus Reader",
    });
  });
});
