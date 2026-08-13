import { describe, expect, it } from "vitest";
import { validatedGoogleOrigin } from "./googleOAuth";

describe("Google OAuth origin validation", () => {
  it("accepts the current public origin only when it matches the request host", () => {
    expect(validatedGoogleOrigin("https://odhyay.example", "odhyay.example")).toBe("https://odhyay.example");
    expect(validatedGoogleOrigin("https://other.example", "odhyay.example")).toBeNull();
    expect(validatedGoogleOrigin("http://odhyay.example", "odhyay.example")).toBeNull();
  });
});
