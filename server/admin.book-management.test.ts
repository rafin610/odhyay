import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ updateBook: vi.fn(), deleteBook: vi.fn() }));
vi.mock("./db", async importOriginal => ({ ...(await importOriginal<typeof import("./db")>()), updateBook: mocks.updateBook, deleteBook: mocks.deleteBook }));

import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function adminContext(): TrpcContext {
  const now = new Date();
  return { user: { id: 1, openId: "google:admin", name: "Administrator", email: null, loginMethod: "google", role: "admin", createdAt: now, updatedAt: now, lastSignedIn: now }, req: {} as TrpcContext["req"], res: {} as TrpcContext["res"] };
}

describe("admin book management", () => {
  it("forwards protected updates and deletions to persistent helpers", async () => {
    mocks.updateBook.mockResolvedValue({ id: 42, slug: "revised-title" }); mocks.deleteBook.mockResolvedValue(true);
    const caller = appRouter.createCaller(adminContext());
    await expect(caller.admin.updateBook({ id: 42, title: "Revised title" })).resolves.toEqual({ id: 42, slug: "revised-title" });
    await expect(caller.admin.deleteBook({ id: 42 })).resolves.toEqual({ success: true });
    expect(mocks.updateBook).toHaveBeenCalledWith(42, { title: "Revised title" }); expect(mocks.deleteBook).toHaveBeenCalledWith(42);
  });
});
