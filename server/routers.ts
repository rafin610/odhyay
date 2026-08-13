import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { addBookmark, createBook, deleteBook, getBookBySlug, listBooks, listCategories, listManagedUsers, setManagedUserRole, toggleFavorite, updateBook, updateReadingProgress } from "./db";

const bookInput = z.object({
  title: z.string().trim().min(1).max(400),
  authorName: z.string().trim().min(1).max(240),
  categoryName: z.string().trim().min(1).max(160),
  description: z.string().trim().min(1).max(10_000),
  pageCount: z.number().int().min(0).max(20_000).optional(),
  status: z.enum(["draft", "published"]),
  coverUrl: z.union([z.string().url(), z.string().regex(/^\/manus-storage\/covers\/[^?#]+$/, "Cover uploads must use a managed cover path.")]).optional(),
  pdfKey: z.string().regex(/^books\/.+\.pdf$/, "PDF uploads must use a managed library key.").max(512).nullable().optional(),
  pdfFilename: z.string().trim().min(1).max(512).nullable().optional(),
  pdfMimeType: z.literal("application/pdf").nullable().optional(),
  pdfSize: z.number().int().positive().max(30 * 1024 * 1024).nullable().optional(),
});
const updateBookInput = bookInput.partial().extend({ id: z.number().int().positive() });

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(({ ctx }) => ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      ctx.res.clearCookie(COOKIE_NAME, { ...getSessionCookieOptions(ctx.req), maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  library: router({
    list: publicProcedure.input(z.object({ query: z.string().trim().max(160).optional(), categorySlug: z.string().trim().max(180).optional() }).optional()).query(async ({ input }) => listBooks(input)),
    getBySlug: publicProcedure.input(z.object({ slug: z.string().min(1).max(460) })).query(async ({ input }) => getBookBySlug(input.slug)),
    categories: publicProcedure.query(() => listCategories()),
  }),
  reader: router({
    saveProgress: protectedProcedure.input(z.object({ bookId: z.number().int().positive(), currentPage: z.number().int().positive(), progressPercentage: z.number().int().min(0).max(100) })).mutation(async ({ ctx, input }) => {
      await updateReadingProgress(ctx.user.id, input.bookId, input.currentPage, input.progressPercentage);
      return { success: true } as const;
    }),
    toggleFavorite: protectedProcedure.input(z.object({ bookId: z.number().int().positive() })).mutation(async ({ ctx, input }) => ({ favorite: await toggleFavorite(ctx.user.id, input.bookId) })),
    addBookmark: protectedProcedure.input(z.object({ bookId: z.number().int().positive(), pageNumber: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      await addBookmark(ctx.user.id, input.bookId, input.pageNumber);
      return { success: true } as const;
    }),
  }),
  admin: router({
    listBooks: adminProcedure.query(() => listBooks({ includeDrafts: true })),
    createBook: adminProcedure.input(bookInput).mutation(async ({ input }) => createBook(input)),
    updateBook: adminProcedure.input(updateBookInput).mutation(async ({ input }) => {
      const { id, ...changes } = input;
      const updated = await updateBook(id, changes);
      if (!updated) throw new TRPCError({ code: "NOT_FOUND", message: "Book not found." });
      return updated;
    }),
    deleteBook: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ input }) => {
      if (!await deleteBook(input.id)) throw new TRPCError({ code: "NOT_FOUND", message: "Book not found." });
      return { success: true } as const;
    }),
    listUsers: adminProcedure.query(() => listManagedUsers()),
    setUserRole: adminProcedure.input(z.object({ openId: z.string().trim().min(1).max(128), role: z.enum(["admin", "user"]) })).mutation(async ({ ctx, input }) => {
      if (ctx.user.openId === input.openId && input.role !== "admin") throw new TRPCError({ code: "BAD_REQUEST", message: "You cannot remove your own administrator access." });
      const updated = await setManagedUserRole(input.openId, input.role);
      if (!updated) throw new TRPCError({ code: "NOT_FOUND", message: "User not found." });
      return { success: true } as const;
    }),
  }),
});

export type AppRouter = typeof appRouter;
