import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("premium interaction system", () => {
  it("defines tactile controls, visible focus treatment, and a reduced-motion fallback", async () => {
    const css = await readFile(new URL("../index.css", import.meta.url), "utf8");
    const publicPage = await readFile(new URL("../pages/OdhyayPersistent.tsx", import.meta.url), "utf8");
    const reader = await readFile(new URL("../pages/ReaderExperience.tsx", import.meta.url), "utf8");
    const admin = await readFile(new URL("../pages/OdhyayPersistentAdmin.tsx", import.meta.url), "utf8");
    const shell = await readFile(new URL("./OdhyayShell.tsx", import.meta.url), "utf8");

    expect(css).toContain(".od-button {");
    expect(css).toContain("min-height: 2.75rem");
    expect(css).toContain(".od-icon-button {");
    expect(css).toContain("width: 2.5rem");
    expect(css).toContain(".focus-ring:focus-visible");
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
    expect(css).toContain(".od-button:hover");
    expect(css).toContain("transform: translateY(-2px)");
    expect(publicPage).toContain("od-hero");
    expect(publicPage).toContain("od-button-primary");
    expect(reader).toContain("od-icon-button");
    expect(admin).toContain("od-button-primary");
    expect(admin).toContain("od-button-outline");
    expect(shell).toContain("mobile-nav-drawer");
  });
});
