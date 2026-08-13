import { afterEach, describe, expect, it } from "vitest";
import { eq, inArray } from "drizzle-orm";
import { authors, books, categories } from "../drizzle/schema";
import { createBook, getDb, toSlug } from "./db";
import { uniqueSlug } from "./fixSlugs.mts";

const runToken = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
const createdBookIds: number[] = [];
const categoryNames: string[] = [];
const authorNames: string[] = [];

afterEach(async () => {
  const db = await getDb();
  if (!db) return;
  if (createdBookIds.length) await db.delete(books).where(inArray(books.id, createdBookIds.splice(0)));
  if (categoryNames.length) await db.delete(categories).where(inArray(categories.name, categoryNames.splice(0)));
  if (authorNames.length) await db.delete(authors).where(inArray(authors.name, authorNames.splice(0)));
});

describe("Unicode slug collision handling", () => {
  it("uses -2 for identical Bengali book titles during normal creation", async () => {
    const authorName = `Unicode collision author ${runToken}`;
    const categoryName = `Unicode collision category ${runToken}`;
    const title = `বাংলা সংঘর্ষ ${runToken}`;
    authorNames.push(authorName);
    categoryNames.push(categoryName);

    const first = await createBook({ title, authorName, categoryName, description: "Collision fixture one", status: "draft" });
    const second = await createBook({ title, authorName, categoryName, description: "Collision fixture two", status: "draft" });
    createdBookIds.push(first.id, second.id);

    expect(first.slug).toBe(toSlug(title));
    expect(second.slug).toBe(`${toSlug(title)}-2`);
  });

  it("uses -2 for distinct Bengali categories that normalize to the same slug", async () => {
    const authorName = `Unicode category author ${runToken}`;
    const firstCategory = `বাংলা বিভাগ! ${runToken}`;
    const secondCategory = `বাংলা বিভাগ ${runToken}`;
    authorNames.push(authorName);
    categoryNames.push(firstCategory, secondCategory);

    const first = await createBook({ title: `প্রথম বিভাগ ${runToken}`, authorName, categoryName: firstCategory, description: "Category fixture one", status: "draft" });
    const second = await createBook({ title: `দ্বিতীয় বিভাগ ${runToken}`, authorName, categoryName: secondCategory, description: "Category fixture two", status: "draft" });
    createdBookIds.push(first.id, second.id);

    const db = await getDb();
    if (!db) throw new Error("Database connection is not configured.");
    const persisted = await db.select({ name: categories.name, slug: categories.slug }).from(categories).where(inArray(categories.name, [firstCategory, secondCategory]));
    const slugs = persisted.map(category => category.slug).sort();

    expect(slugs).toEqual([toSlug(firstCategory), `${toSlug(firstCategory)}-2`].sort());
  });

  it("uses the next available suffix for the legacy slug migration helper", () => {
    const base = toSlug("বাংলা সাহিত্য");
    expect(uniqueSlug(base, new Set([base, `${base}-2`]), 180)).toBe(`${base}-3`);
  });
});
