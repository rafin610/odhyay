import { describe, expect, it } from "vitest";
import { toSlug } from "./db";

describe("ODHYAY persistence helpers", () => {
  it("creates stable URL-safe book slugs", () => {
    expect(toSlug("  The Shape of Silence!  ")).toBe("the-shape-of-silence");
    expect(toSlug("A   Small Atlas---of Stars")).toBe("a-small-atlas-of-stars");
  });

  it("preserves Unicode letters and numbers in URL-safe slugs", () => {
    expect(toSlug("বাংলা সাহিত্য")).toBe("বাংলা-সাহিত্য");
    expect(toSlug("Bangla: বাংলা সাহিত্য ২০২৬!")).toBe("bangla-বাংলা-সাহিত্য-২০২৬");
  });
});
