import { describe, expect, it } from "vitest";
import { toSlug } from "./db";

describe("ODHYAY persistence helpers", () => {
  it("creates stable URL-safe book slugs", () => {
    expect(toSlug("  The Shape of Silence!  ")).toBe("the-shape-of-silence");
    expect(toSlug("A   Small Atlas---of Stars")).toBe("a-small-atlas-of-stars");
  });

  it("uses a safe fallback for non-Latin-only titles", () => {
    expect(toSlug("বাংলা সাহিত্য")).toBe("untitled");
  });
});
