import { afterEach, describe, expect, it, vi } from "vitest";
import { loadReaderTheme, persistReaderTheme } from "@/lib/readerTheme";

describe("reader theme persistence", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("defaults safely when browser storage is blocked", () => {
    vi.stubGlobal("window", {
      localStorage: {
        getItem: () => {
          throw new Error("Storage denied");
        },
        setItem: () => {
          throw new Error("Storage denied");
        },
      },
    });

    expect(loadReaderTheme()).toBe("dark");
    expect(() => persistReaderTheme("sepia")).not.toThrow();
  });

  it("only restores approved reader themes", () => {
    vi.stubGlobal("window", {
      localStorage: {
        getItem: () => "unexpected-value",
        setItem: vi.fn(),
      },
    });

    expect(loadReaderTheme()).toBe("dark");
  });
});
