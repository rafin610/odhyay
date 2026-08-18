import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("Express 5 wildcard compatibility", () => {
  it("uses named catch-all routes for development and production SPA fallbacks", async () => {
    const source = await readFile(new URL("./_core/vite.ts", import.meta.url), "utf8");

    expect(source).toContain('app.use("/{*splat}"');
    expect(source).not.toContain('app.use("*"');
  });
});
