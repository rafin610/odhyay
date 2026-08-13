import { describe, expect, it } from "vitest";
import { googleIdentityFromProfile, validatedGoogleOrigin } from "./googleOAuth";

describe("Google OAuth origin validation", () => {
  it("accepts the current public origin only when it matches the request host", () => {
    expect(validatedGoogleOrigin("https://odhyay.example", "odhyay.example")).toBe("https://odhyay.example");
    expect(validatedGoogleOrigin("https://other.example", "odhyay.example")).toBeNull();
    expect(validatedGoogleOrigin("http://odhyay.example", "odhyay.example")).toBeNull();
  });
});

describe("Google profile normalization", () => {
  it("preserves supplied profile data and gives a safe reader name when Google omits it", () => {
    expect(googleIdentityFromProfile({ sub: "123", name: "  A. Reader  ", email: " reader@example.com " })).toEqual({
      openId: "google:123",
      name: "A. Reader",
      email: "reader@example.com",
      loginMethod: "google",
    });
    expect(googleIdentityFromProfile({ sub: "456" })).toEqual({
      openId: "google:456",
      name: "Google reader",
      email: null,
      loginMethod: "google",
    });
  });
});
