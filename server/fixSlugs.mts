import { eq } from "drizzle-orm";
import { pathToFileURL } from "node:url";
import { books, categories } from "../drizzle/schema";
import { getDb, toSlug } from "./db";

export const legacyUntitledSlug = /^untitled(?:-\d+)?$/;

export function uniqueSlug(base: string, used: Set<string>, maxLength: number) {
  let suffix = 1;
  let candidate = base.slice(0, maxLength);

  while (used.has(candidate)) {
    suffix += 1;
    const collisionSuffix = `-${suffix}`;
    candidate = `${base.slice(0, maxLength - collisionSuffix.length)}${collisionSuffix}`;
  }

  return candidate;
}

export async function repairLegacySlugs() {
  const db = await getDb();
  if (!db) throw new Error("Database connection is not configured.");

  const allBooks = await db.select({ id: books.id, title: books.title, slug: books.slug }).from(books).orderBy(books.id);
  const affectedBooks = allBooks.filter(book => legacyUntitledSlug.test(book.slug));
  const usedBookSlugs = new Set(allBooks.filter(book => !legacyUntitledSlug.test(book.slug)).map(book => book.slug));

  for (const book of affectedBooks) {
    const nextSlug = uniqueSlug(toSlug(book.title), usedBookSlugs, 460);
    await db.update(books).set({ slug: nextSlug }).where(eq(books.id, book.id));
    usedBookSlugs.add(nextSlug);
    console.log(`book ${book.id}: ${book.slug} -> ${nextSlug}`);
  }

  const allCategories = await db.select({ id: categories.id, name: categories.name, slug: categories.slug }).from(categories).orderBy(categories.id);
  const affectedCategories = allCategories.filter(category => legacyUntitledSlug.test(category.slug));
  const usedCategorySlugs = new Set(allCategories.filter(category => !legacyUntitledSlug.test(category.slug)).map(category => category.slug));

  for (const category of affectedCategories) {
    const nextSlug = uniqueSlug(toSlug(category.name), usedCategorySlugs, 180);
    await db.update(categories).set({ slug: nextSlug }).where(eq(categories.id, category.id));
    usedCategorySlugs.add(nextSlug);
    console.log(`category ${category.id}: ${category.slug} -> ${nextSlug}`);
  }

  console.log(`Repaired ${affectedBooks.length} book slug(s) and ${affectedCategories.length} category slug(s).`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  repairLegacySlugs().then(() => {
    process.exit(0);
  }).catch(error => {
    console.error("Slug repair failed:", error);
    process.exit(1);
  });
}
