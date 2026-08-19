import { and, eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { bookmarks, readingProgress } from "../drizzle/schema";
import { getDb, getUserByOpenId, listBooks, upsertUser } from "./db";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

describe("reader persistence", () => {
  it("stores progress and bookmarks for an authenticated reader", async () => {
    await upsertUser({ openId: "odhyay-integration-reader", name: "ODHYAY Integration Reader", role: "user" });
    const reader = await getUserByOpenId("odhyay-integration-reader");
    const book = (await listBooks())[0];
    const db = await getDb();

    expect(reader).toBeDefined();
    expect(book).toBeDefined();
    expect(db).toBeDefined();
    if (!reader || !book || !db) return;

    const ctx: TrpcContext = { user: reader, req: {} as TrpcContext["req"], res: {} as TrpcContext["res"] };
    const caller = appRouter.createCaller(ctx);
    await caller.reader.saveProgress({ bookId: book.id, currentPage: 2, progressPercentage: 17 });
    await caller.reader.addBookmark({ bookId: book.id, pageNumber: 2 });

    const progress = await db.select().from(readingProgress).where(and(eq(readingProgress.userId, reader.id), eq(readingProgress.bookId, book.id))).limit(1);
    const savedBookmark = await db.select().from(bookmarks).where(and(eq(bookmarks.userId, reader.id), eq(bookmarks.bookId, book.id), eq(bookmarks.pageNumber, 2))).limit(1);
    const restoredProgress = await caller.reader.getProgress({ bookId: book.id });

    expect(progress[0]).toMatchObject({ currentPage: 2, progressPercentage: 17 });
    expect(restoredProgress).toMatchObject({ currentPage: 2, progressPercentage: 17 });
    expect(savedBookmark).toHaveLength(1);
  });
});
