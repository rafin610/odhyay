import { afterEach, describe, expect, it, vi } from "vitest";
import { sdk } from "./_core/sdk";

describe("public session handling", () => {
  afterEach(() => vi.restoreAllMocks());

  it("returns an anonymous session without warning when no cookie is present", async () => {
    const warning = vi.spyOn(console, "warn");

    await expect(sdk.verifySession(undefined)).resolves.toBeNull();

    expect(warning).not.toHaveBeenCalled();
  });
});
