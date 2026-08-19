import React, { createContext, useContext, useEffect, useState } from "react";

export type Theme = "light" | "dark";
export const THEME_STORAGE_KEY = "odhyay-color-theme";

export function getStoredTheme(storage: Pick<Storage, "getItem">): Theme | undefined {
  try {
    const value = storage.getItem(THEME_STORAGE_KEY);
    return value === "light" || value === "dark" ? value : undefined;
  } catch {
    return undefined;
  }
}

export function getSystemTheme(prefersDark: boolean): Theme {
  return prefersDark ? "dark" : "light";
}

function readInitialTheme(fallback: Theme): { theme: Theme; hasManualPreference: boolean } {
  if (typeof window === "undefined") return { theme: fallback, hasManualPreference: false };
  const stored = getStoredTheme(window.localStorage);
  if (stored) return { theme: stored, hasManualPreference: true };
  return { theme: getSystemTheme(window.matchMedia("(prefers-color-scheme: dark)").matches), hasManualPreference: false };
}

type ThemeContextType = { theme: Theme; setTheme: (theme: Theme) => void; toggleTheme: () => void; resetToSystem: () => void };
const standaloneThemeContext: ThemeContextType = { theme: "light", setTheme: () => undefined, toggleTheme: () => undefined, resetToSystem: () => undefined };
const ThemeContext = createContext<ThemeContextType>(standaloneThemeContext);

export function ThemeProvider({ children, defaultTheme = "light" }: { children: React.ReactNode; defaultTheme?: Theme }) {
  const initial = readInitialTheme(defaultTheme);
  const [theme, setThemeState] = useState<Theme>(initial.theme);
  const [hasManualPreference, setHasManualPreference] = useState(initial.hasManualPreference);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.style.colorScheme = theme;
  }, [theme]);

  useEffect(() => {
    if (typeof window === "undefined" || hasManualPreference) return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const update = (event: MediaQueryListEvent) => setThemeState(getSystemTheme(event.matches));
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [hasManualPreference]);

  const setTheme = (nextTheme: Theme) => {
    setThemeState(nextTheme);
    setHasManualPreference(true);
    try { window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme); } catch { /* Storage is optional. */ }
  };
  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");
  const resetToSystem = () => {
    setHasManualPreference(false);
    try { window.localStorage.removeItem(THEME_STORAGE_KEY); } catch { /* Storage is optional. */ }
    if (typeof window !== "undefined") setThemeState(getSystemTheme(window.matchMedia("(prefers-color-scheme: dark)").matches));
  };

  return <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, resetToSystem }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
