import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("Vercel Vite and API routing", () => {
  it("keeps the SPA on CDN output while exposing the Express app through /api", async () => {
    const [configText, apiEntry] = await Promise.all([
      readFile(new URL("../vercel.json", import.meta.url), "utf8"),
      readFile(new URL("../api/[...path].ts", import.meta.url), "utf8"),
    ]);
    const config = JSON.parse(configText) as {
      framework?: string;
      outputDirectory?: string;
      rewrites?: Array<{ source: string; destination: string }>;
    };

    expect(config.framework).toBe("vite");
    expect(config.outputDirectory).toBe("public");
    expect(config).toMatchObject({
      functions: {
        "api/[...path].ts": { maxDuration: 10 },
      },
    });
    expect(config.rewrites).toContainEqual({
      source: "/api/(.*)",
      destination: "/api/[...path]",
    });
    expect(config.rewrites).toContainEqual({
      source: "/((?!api/).*)",
      destination: "/index.html",
    });
    expect(apiEntry).toContain('import { createApp } from "../server/app.js";');
    expect(apiEntry).toContain("export default app;");
  });
});
