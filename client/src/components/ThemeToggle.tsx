import React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, toggleTheme } = useTheme();
  const nextTheme = theme === "dark" ? "light" : "dark";
  const label = `Switch to ${nextTheme === "light" ? "warm paper light" : "dark"} mode`;
  return <button type="button" onClick={toggleTheme} aria-label={label} title={label} className="focus-ring od-theme-toggle inline-flex min-h-10 items-center justify-center gap-2 px-2 text-xs font-semibold">
    {theme === "dark" ? <Sun size={16} aria-hidden="true" /> : <Moon size={16} aria-hidden="true" />}
    {!compact && <span className="hidden lg:inline">{theme === "dark" ? "Light" : "Dark"}</span>}
  </button>;
}
