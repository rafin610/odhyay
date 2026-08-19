import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ThemeProvider, THEME_STORAGE_KEY, useTheme } from "./ThemeContext";

function ThemeProbe() {
  const { theme, toggleTheme } = useTheme();
  return <button type="button" onClick={toggleTheme}>Current theme: {theme}</button>;
}

function renderProbe() {
  return render(<ThemeProvider><ThemeProbe /></ThemeProvider>);
}

describe("ThemeProvider manual override", () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.dataset.theme = "";
    vi.stubGlobal("matchMedia", vi.fn().mockReturnValue({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
  });

  afterEach(() => vi.unstubAllGlobals());

  it("writes a manual override, applies the document attribute, and restores it after a fresh render", async () => {
    const first = renderProbe();
    expect(screen.getByRole("button").textContent).toContain("Current theme: light");
    fireEvent.click(screen.getByRole("button"));

    await waitFor(() => expect(document.documentElement.dataset.theme).toBe("dark"));
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
    first.unmount();

    renderProbe();
    expect(screen.getByRole("button").textContent).toContain("Current theme: dark");
    await waitFor(() => expect(document.documentElement.dataset.theme).toBe("dark"));
  });
});
