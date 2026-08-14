import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createAdminContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "odhyay-test-admin",
      name: "ODHYAY Test Admin",
      email: "admin@example.com",
      loginMethod: "manus",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {} as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("admin.listBooks", () => {
  it("returns normalized persistent records for an administrator without requiring a seeded title", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const records = await caller.admin.listBooks();

    expect(Array.isArray(records)).toBe(true);
    expect(records.every((book) => typeof book.id === "number" && typeof book.slug === "string" && typeof book.title === "string")).toBe(true);
  });
});
