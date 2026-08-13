import { afterEach, describe, expect, it } from "vitest";
import { eq, or } from "drizzle-orm";
import { authors, bookmarks, categories, favorites, readingProgress, users } from "../drizzle/schema";
import { addBookmark, createBook, deleteBook, getBookBySlug, getDb, getUserByOpenId, toggleFavorite, updateBook, updateReadingProgress, upsertUser } from "./db";

const runToken = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
const userOpenId = `book-management-${runToken}`;
const initialAuthorName = `Initial author ${runToken}`;
const updatedAuthorName = `Updated author ${runToken}`;
const initialCategoryName = `Initial category ${runToken}`;
const updatedCategoryName = `Updated category ${runToken}`;
let createdBookId: number | undefined;

afterEach(async () => {
  const db = await getDb();
  if (!db) return;
  if (createdBookId !== undefined) await deleteBook(createdBookId);
  await db.delete(users).where(eq(users.openId, userOpenId));
  await db.delete(categories).where(or(eq(categories.name, initialCategoryName), eq(categories.name, updatedCategoryName)));
  await db.delete(authors).where(or(eq(authors.name, initialAuthorName), eq(authors.name, updatedAuthorName)));
  createdBookId = undefined;
});

describe("book management persistence", () => {
  it("updates book metadata and deletes dependent reader data through foreign-key cascades", async () => {
    const initial = await createBook({ title: `Initial Bengali book ${runToken}`, authorName: initialAuthorName, categoryName: initialCategoryName, description: "Initial description", pageCount: 10, status: "draft" });
    createdBookId = initial.id;

    const updated = await updateBook(initial.id, { title: `পরিবর্তিত বই ${runToken}`, authorName: updatedAuthorName, categoryName: updatedCategoryName, description: "Updated description", pageCount: 24, status: "published", coverUrl: "https://example.com/cover.jpg", pdfKey: "books/updated.pdf", pdfFilename: "updated.pdf", pdfMimeType: "application/pdf", pdfSize: 2_048 });
    expect(updated?.slug).toBe(`পরিবর্তিত-বই-${runToken}`);

    const persisted = await getBookBySlug(`পরিবর্তিত-বই-${runToken}`, true);
    expect(persisted).toMatchObject({ id: initial.id, title: `পরিবর্তিত বই ${runToken}`, authorName: updatedAuthorName, categoryName: updatedCategoryName, description: "Updated description", pageCount: 24, status: "published", coverUrl: "https://example.com/cover.jpg", pdfKey: "books/updated.pdf", pdfFilename: "updated.pdf", pdfMimeType: "application/pdf", pdfSize: 2_048 });

    await upsertUser({ openId: userOpenId, name: "Book management test reader", loginMethod: "test" });
    const reader = await getUserByOpenId(userOpenId);
    if (!reader) throw new Error("Test reader was not created.");
    await updateReadingProgress(reader.id, initial.id, 4, 20);
    await toggleFavorite(reader.id, initial.id);
    await addBookmark(reader.id, initial.id, 4);

    await expect(deleteBook(initial.id)).resolves.toBe(true);
    createdBookId = undefined;
    const db = await getDb();
    if (!db) throw new Error("Database connection is not configured.");
    await expect(db.select().from(readingProgress).where(eq(readingProgress.bookId, initial.id))).resolves.toHaveLength(0);
    await expect(db.select().from(favorites).where(eq(favorites.bookId, initial.id))).resolves.toHaveLength(0);
    await expect(db.select().from(bookmarks).where(eq(bookmarks.bookId, initial.id))).resolves.toHaveLength(0);
  });
});
