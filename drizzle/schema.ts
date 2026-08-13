import { index, int, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

/** Core user identities managed by the built-in OAuth flow. */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const authors = mysqlTable("authors", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 240 }).notNull().unique(),
  bio: text("bio"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const categories = mysqlTable("categories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 160 }).notNull().unique(),
  slug: varchar("slug", { length: 180 }).notNull().unique(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const books = mysqlTable("books", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 400 }).notNull(),
  slug: varchar("slug", { length: 460 }).notNull().unique(),
  description: text("description").notNull(),
  coverUrl: text("coverUrl"),
  pdfKey: varchar("pdfKey", { length: 512 }),
  pdfFilename: varchar("pdfFilename", { length: 512 }),
  pdfMimeType: varchar("pdfMimeType", { length: 100 }),
  pdfSize: int("pdfSize"),
  authorId: int("authorId").notNull().references(() => authors.id, { onDelete: "restrict" }),
  categoryId: int("categoryId").references(() => categories.id, { onDelete: "set null" }),
  pageCount: int("pageCount").default(0).notNull(),
  status: mysqlEnum("status", ["draft", "published"]).default("draft").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [index("books_status_idx").on(table.status), index("books_category_idx").on(table.categoryId)]);

export const readingProgress = mysqlTable("reading_progress", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  bookId: int("bookId").notNull().references(() => books.id, { onDelete: "cascade" }),
  currentPage: int("currentPage").default(1).notNull(),
  progressPercentage: int("progressPercentage").default(0).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [uniqueIndex("reading_progress_user_book_uq").on(table.userId, table.bookId)]);

export const favorites = mysqlTable("favorites", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  bookId: int("bookId").notNull().references(() => books.id, { onDelete: "cascade" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [uniqueIndex("favorites_user_book_uq").on(table.userId, table.bookId)]);

export const bookmarks = mysqlTable("bookmarks", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  bookId: int("bookId").notNull().references(() => books.id, { onDelete: "cascade" }),
  pageNumber: int("pageNumber").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [uniqueIndex("bookmarks_user_book_page_uq").on(table.userId, table.bookId, table.pageNumber)]);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type BookRecord = typeof books.$inferSelect;
