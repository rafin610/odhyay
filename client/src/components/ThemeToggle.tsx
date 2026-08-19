import React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, toggleTheme } = useTheme();
  const nextTheme = theme === "dark" ? "light" : "dark";
  const label = `Switch to ${nextTheme === "light" ? "warm paper light" : "dark"} mode`;
  return <button type="button" onClick={toggleTheme} aria-label={label} title={label} className={`focus-ring od-theme-toggle ${compact ? "od-icon-button" : "od-button od-button-quiet"}`}>
    {theme === "dark" ? <Sun size={16} aria-hidden="true" /> : <Moon size={16} aria-hidden="true" />}
    {!compact && <span className="hidden lg:inline">{theme === "dark" ? "Light" : "Dark"}</span>}
  </button>;
}
