import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

type ThemeTokens = Record<string, string>;

function parseTokens(block: string): ThemeTokens {
  return Object.fromEntries([...block.matchAll(/--(od-[\w-]+):\s*(#[\da-f]{6})/gi)].map(([, name, value]) => [name, value]));
}

function luminance(hex: string) {
  const channels = hex.slice(1).match(/.{2}/g)?.map(value => parseInt(value, 16) / 255) ?? [];
  const linear = channels.map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4);
  return .2126 * linear[0]! + .7152 * linear[1]! + .0722 * linear[2]!;
}

function contrast(foreground: string, background: string) {
  const [lighter, darker] = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (lighter + .05) / (darker + .05);
}

describe("ODHYAY semantic palette contrast", () => {
  it("keeps all primary readable text and control pairings at WCAG AA", async () => {
    const css = await readFile(new URL("../index.css", import.meta.url), "utf8");
    const light = parseTokens(css.match(/:root\s*\{([^}]*)}/)?.[1] ?? "");
    const dark = parseTokens(css.match(/:root\[data-theme="dark"]\s*\{([^}]*)}/)?.[1] ?? "");
    const combinations: [string, string][] = [["od-ink", "od-background"], ["od-ink", "od-surface"], ["od-ink", "od-surface-raised"], ["od-ink-muted", "od-background"], ["od-ink-muted", "od-surface"], ["od-ink-subtle", "od-background"], ["od-accent", "od-background"], ["od-accent", "od-surface"], ["od-positive", "od-background"], ["od-warning", "od-background"], ["od-danger", "od-background"], ["od-accent-ink", "od-accent"]];

    for (const [name, tokens] of [["light", light], ["dark", dark]] as const) {
      for (const [foreground, background] of combinations) {
        expect(tokens[foreground], `${name} ${foreground} token`).toMatch(/^#[\da-f]{6}$/i);
        expect(tokens[background], `${name} ${background} token`).toMatch(/^#[\da-f]{6}$/i);
        expect(contrast(tokens[foreground]!, tokens[background]!), `${name} ${foreground} on ${background}`).toBeGreaterThanOrEqual(4.5);
      }
    }
  });
});
