import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const runtimeFiles = [
  "server.ts",
  "server/app.ts",
  "server/googleOAuth.ts",
  "server/coverUpload.ts",
  "server/pdfUpload.ts",
  "server/pdfReader.ts",
  "server/vercelBlobUpload.ts",
  "server/storage.ts",
  "server/db.ts",
  "server/routers.ts",
  "server/_core/context.ts",
  "server/_core/oauth.ts",
  "server/_core/sdk.ts",
  "server/_core/systemRouter.ts",
  "server/_core/trpc.ts",
  "server/_core/notification.ts",
  "server/_core/storageProxy.ts",
];

describe("Vercel ESM runtime imports", () => {
  it("uses explicit JavaScript extensions for every traced local runtime import", async () => {
    for (const file of runtimeFiles) {
      const source = await readFile(new URL(`../${file}`, import.meta.url), "utf8");
      const specifiers = [...source.matchAll(/from\s+["'](\.{1,2}\/[^"']+)["']/g)].map((match) => match[1]);

      expect(source, file).not.toMatch(/@shared\//);
      for (const specifier of specifiers) {
        expect(specifier, `${file}: ${specifier}`).toMatch(/\.js$/);
      }
    }
  });
});
