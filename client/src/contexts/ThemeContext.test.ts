import { describe, expect, it } from "vitest";
import { getSystemTheme, getStoredTheme, THEME_STORAGE_KEY } from "./ThemeContext";

describe("global theme preferences", () => {
  it("uses a distinct stored manual override key", () => {
    expect(THEME_STORAGE_KEY).toBe("odhyay-color-theme");
    expect(getStoredTheme({ getItem: () => "light" } as Storage)).toBe("light");
    expect(getStoredTheme({ getItem: () => "invalid" } as Storage)).toBeUndefined();
  });

  it("maps system media preference to a supported global theme", () => {
    expect(getSystemTheme(true)).toBe("dark");
    expect(getSystemTheme(false)).toBe("light");
  });
});
