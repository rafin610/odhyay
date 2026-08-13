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
  it("returns the persisted ODHYAY starter book for an administrator", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const records = await caller.admin.listBooks();

    expect(records.some((book) => book.slug === "welcome-to-odhyay")).toBe(true);
  });
});
