import { afterEach, describe, expect, it } from "vitest";
import { and, eq, inArray } from "drizzle-orm";
import { authors, books, categories } from "../drizzle/schema";
import { getDb, toSlug } from "./db";
import { repairLegacySlugs } from "./fixSlugs.mts";

const runToken = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
const createdBookIds: number[] = [];
const createdCategoryIds: number[] = [];
let createdAuthorId: number | undefined;

afterEach(async () => {
  const db = await getDb();
  if (!db) return;
  if (createdBookIds.length) await db.delete(books).where(inArray(books.id, createdBookIds.splice(0)));
  if (createdCategoryIds.length) await db.delete(categories).where(inArray(categories.id, createdCategoryIds.splice(0)));
  if (createdAuthorId !== undefined) await db.delete(authors).where(eq(authors.id, createdAuthorId));
  createdAuthorId = undefined;
});

describe("legacy Unicode slug repair", () => {
  it("rewrites untitled Bengali book and category slugs with safe -2 and -3 collision suffixes", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database connection is not configured.");

    const bookTitle = `বাংলা উত্তরাধিকার ${runToken}`;
    const categoryName = `বাংলা বিষয় ${runToken}`;
    const authorResult = await db.insert(authors).values({ name: `Legacy slug author ${runToken}` });
    createdAuthorId = Number(authorResult[0].insertId);

    const existingCategory = await db.insert(categories).values({ name: categoryName, slug: toSlug(categoryName) });
    createdCategoryIds.push(Number(existingCategory[0].insertId));
    const legacyCategoryOne = await db.insert(categories).values({ name: `${categoryName}!`, slug: "untitled" });
    const legacyCategoryTwo = await db.insert(categories).values({ name: `${categoryName}?`, slug: "untitled-2" });
    createdCategoryIds.push(Number(legacyCategoryOne[0].insertId), Number(legacyCategoryTwo[0].insertId));

    const categoryId = Number(existingCategory[0].insertId);
    const existingBook = await db.insert(books).values({ title: bookTitle, slug: toSlug(bookTitle), description: "Existing unicode slug", authorId: createdAuthorId, categoryId, status: "draft" });
    const legacyBookOne = await db.insert(books).values({ title: `${bookTitle}!`, slug: "untitled", description: "Legacy unicode slug one", authorId: createdAuthorId, categoryId, status: "draft" });
    const legacyBookTwo = await db.insert(books).values({ title: `${bookTitle}?`, slug: "untitled-2", description: "Legacy unicode slug two", authorId: createdAuthorId, categoryId, status: "draft" });
    createdBookIds.push(Number(existingBook[0].insertId), Number(legacyBookOne[0].insertId), Number(legacyBookTwo[0].insertId));

    await repairLegacySlugs();

    const repairedBooks = await db.select({ slug: books.slug }).from(books).where(inArray(books.id, createdBookIds));
    const repairedCategories = await db.select({ slug: categories.slug }).from(categories).where(inArray(categories.id, createdCategoryIds));
    const expectedBookSlugs = [toSlug(bookTitle), `${toSlug(bookTitle)}-2`, `${toSlug(bookTitle)}-3`].sort();
    const expectedCategorySlugs = [toSlug(categoryName), `${toSlug(categoryName)}-2`, `${toSlug(categoryName)}-3`].sort();

    expect(repairedBooks.map(book => book.slug).sort()).toEqual(expectedBookSlugs);
    expect(repairedCategories.map(category => category.slug).sort()).toEqual(expectedCategorySlugs);
  });
});
