export type ReaderTheme = "dark" | "daylight" | "sepia";

export function loadReaderTheme(): ReaderTheme {
  try {
    const value = window.localStorage.getItem("odhyay-reader-theme");
    return value === "daylight" || value === "sepia" || value === "dark" ? value : "dark";
  } catch {
    return "dark";
  }
}

export function persistReaderTheme(theme: ReaderTheme) {
  try {
    window.localStorage.setItem("odhyay-reader-theme", theme);
  } catch {
    // Reader appearance remains usable when browser privacy settings block storage.
  }
}
