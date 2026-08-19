import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("public category shelf safeguards", () => {
  it("keeps draft-only and orphaned categories out of the public catalog query", async () => {
    const source = await readFile(new URL("./db.ts", import.meta.url), "utf8");

    expect(source).toContain(".innerJoin(books, and(eq(books.categoryId, categories.id), eq(books.status, \"published\")))");
    expect(source).toContain(".groupBy(categories.id, categories.name, categories.slug, categories.description, categories.createdAt)");
  });

  it("guards the public page and category grid against horizontal overflow", async () => {
    const [shellSource, pageSource] = await Promise.all([
      readFile(new URL("../client/src/components/OdhyayShell.tsx", import.meta.url), "utf8"),
      readFile(new URL("../client/src/pages/OdhyayPersistent.tsx", import.meta.url), "utf8"),
    ]);

    expect(shellSource).toContain("overflow-x-clip");
    expect(pageSource).toContain("lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]");
    expect(pageSource).toContain("min-w-0 break-words");
  });
});
