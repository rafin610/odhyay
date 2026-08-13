import { describe, expect, it } from "vitest";

describe("Google OAuth credentials", () => {
  it("is accepted by Google before an intentionally invalid authorization code is rejected", async () => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    expect(clientId).toBeTruthy();
    expect(clientSecret).toBeTruthy();

    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId!,
        client_secret: clientSecret!,
        code: "odhyay-intentionally-invalid-code",
        grant_type: "authorization_code",
        redirect_uri: "https://3000-i99hd86gg82sx0jkvaczi-6e8f8aec.us4.manus.computer/api/auth/google/callback",
      }),
    });
    const payload = await response.json() as { error?: string };

    expect(payload.error).not.toBe("invalid_client");
    expect(payload.error).toBe("invalid_grant");
  }, 15_000);
});
