import { and, desc, eq, like, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { authors, bookmarks, books, categories, favorites, InsertUser, readingProgress, users } from "../drizzle/schema";
import { ENV } from "./_core/env";

let connection: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!connection && process.env.DATABASE_URL) connection = drizzle(process.env.DATABASE_URL);
  return connection;
}

async function requireDb() {
  const db = await getDb();
  if (!db) throw new Error("Database connection is not configured.");
  return db;
}

export function toSlug(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "") || "untitled";
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  await db.insert(users).values({ ...user, lastSignedIn: user.lastSignedIn ?? new Date(), role: user.role ?? (user.openId === ENV.ownerOpenId ? "admin" : "user") }).onDuplicateKeyUpdate({ set: { name: user.name ?? null, email: user.email ?? null, loginMethod: user.loginMethod ?? null, lastSignedIn: new Date() } });
}

export async function getUserByOpenId(openId: string) { const db = await getDb(); if (!db) return undefined; const rows = await db.select().from(users).where(eq(users.openId, openId)).limit(1); return rows[0]; }

export async function listManagedUsers() {
  const db = await requireDb();
  return db.select({ id: users.id, openId: users.openId, name: users.name, email: users.email, loginMethod: users.loginMethod, role: users.role, lastSignedIn: users.lastSignedIn }).from(users).orderBy(desc(users.lastSignedIn));
}

export async function setManagedUserRole(openId: string, role: "admin" | "user") {
  const db = await requireDb();
  const result = await db.update(users).set({ role }).where(eq(users.openId, openId));
  return Number(result[0].affectedRows) > 0;
}

export async function listCategories() { const db = await requireDb(); return db.select().from(categories).orderBy(categories.name); }

export async function listBooks(input: { query?: string; categorySlug?: string; includeDrafts?: boolean } = {}) {
  const db = await requireDb();
  const conditions = input.includeDrafts ? [] : [eq(books.status, "published")];
  if (input.categorySlug) conditions.push(eq(categories.slug, input.categorySlug));
  if (input.query) { const needle = `%${input.query}%`; conditions.push(or(like(books.title, needle), like(authors.name, needle), like(categories.name, needle))!); }
  return db.select({ id: books.id, title: books.title, slug: books.slug, description: books.description, coverUrl: books.coverUrl, pdfKey: books.pdfKey, pageCount: books.pageCount, status: books.status, createdAt: books.createdAt, updatedAt: books.updatedAt, authorName: authors.name, categoryName: categories.name, categorySlug: categories.slug }).from(books).innerJoin(authors, eq(books.authorId, authors.id)).leftJoin(categories, eq(books.categoryId, categories.id)).where(conditions.length ? and(...conditions) : undefined).orderBy(desc(books.updatedAt));
}

export async function getBookBySlug(slug: string, includeDrafts = false) { const rows = await listBooks({ includeDrafts }); return rows.find((book) => book.slug === slug); }

async function ensureAuthor(name: string) { const db = await requireDb(); const found = await db.select().from(authors).where(eq(authors.name, name)).limit(1); if (found[0]) return found[0].id; const result = await db.insert(authors).values({ name }); return Number(result[0].insertId); }
async function ensureCategory(name: string) { const db = await requireDb(); const found = await db.select().from(categories).where(eq(categories.name, name)).limit(1); if (found[0]) return found[0].id; const base = toSlug(name); let slug = base; let suffix = 2; while ((await db.select().from(categories).where(eq(categories.slug, slug)).limit(1))[0]) slug = `${base}-${suffix++}`; const result = await db.insert(categories).values({ name, slug }); return Number(result[0].insertId); }

export async function createBook(input: { title: string; authorName: string; categoryName: string; description: string; pageCount?: number; status: "draft" | "published"; coverUrl?: string; pdfKey?: string }) {
  const db = await requireDb(); const authorId = await ensureAuthor(input.authorName.trim()); const categoryId = await ensureCategory(input.categoryName.trim()); const base = toSlug(input.title); let slug = base; let suffix = 2; while ((await db.select().from(books).where(eq(books.slug, slug)).limit(1))[0]) slug = `${base}-${suffix++}`;
  const result = await db.insert(books).values({ title: input.title.trim(), slug, description: input.description.trim(), authorId, categoryId, pageCount: input.pageCount ?? 0, status: input.status, coverUrl: input.coverUrl ?? null, pdfKey: input.pdfKey ?? null });
  return { id: Number(result[0].insertId), slug };
}

export async function updateReadingProgress(userId: number, bookId: number, currentPage: number, progressPercentage: number) { const db = await requireDb(); await db.insert(readingProgress).values({ userId, bookId, currentPage, progressPercentage }).onDuplicateKeyUpdate({ set: { currentPage, progressPercentage, updatedAt: new Date() } }); }
export async function toggleFavorite(userId: number, bookId: number) { const db = await requireDb(); const found = await db.select().from(favorites).where(and(eq(favorites.userId, userId), eq(favorites.bookId, bookId))).limit(1); if (found[0]) { await db.delete(favorites).where(eq(favorites.id, found[0].id)); return false; } await db.insert(favorites).values({ userId, bookId }); return true; }
export async function addBookmark(userId: number, bookId: number, pageNumber: number) { const db = await requireDb(); await db.insert(bookmarks).values({ userId, bookId, pageNumber }).onDuplicateKeyUpdate({ set: { pageNumber } }); }
