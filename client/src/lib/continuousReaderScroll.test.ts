import { describe, expect, it } from "vitest";
import { consumeContinuousScroll, touchPageChange } from "./continuousReaderScroll";

describe("continuous reader page navigation", () => {
  it("accumulates small wheel and trackpad deltas before changing a page", () => {
    expect(consumeContinuousScroll(0, 28)).toEqual({ change: 0, accumulated: 28 });
    expect(consumeContinuousScroll(28, 44)).toEqual({ change: 1, accumulated: 0 });
    expect(consumeContinuousScroll(0, -72)).toEqual({ change: -1, accumulated: 0 });
  });

  it("maps intentional vertical touch swipes to directional page changes", () => {
    expect(touchPageChange(500, 440)).toBe(1);
    expect(touchPageChange(440, 500)).toBe(-1);
    expect(touchPageChange(500, 485)).toBe(0);
  });
});
