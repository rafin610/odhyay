import { describe, expect, it } from "vitest";
import { clampReaderProgress, renderPixelRatio } from "@/lib/readerCanvas";

describe("ContinuousPdfReader rendering helpers", () => {
  it("keeps reader progress bounded for persistence and resume", () => {
    expect(clampReaderProgress(-9)).toBe(0);
    expect(clampReaderProgress(51.6)).toBe(52);
    expect(clampReaderProgress(109)).toBe(100);
  });

  it("uses device-aware high-DPI rendering without exceeding a page memory budget", () => {
    expect(renderPixelRatio(760, 985, 2)).toBe(2);
    expect(renderPixelRatio(760, 985, 4)).toBe(3);
    expect(renderPixelRatio(3600, 5200, 3)).toBe(1);
  });
});
