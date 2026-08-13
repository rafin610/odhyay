import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  listManagedUsers: vi.fn(),
  setManagedUserRole: vi.fn(),
}));

vi.mock("./db", async importOriginal => ({
  ...(await importOriginal<typeof import("./db")>()),
  listManagedUsers: mocks.listManagedUsers,
  setManagedUserRole: mocks.setManagedUserRole,
}));

import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function adminContext(): TrpcContext {
  const now = new Date();
  return { user: { id: 1, openId: "google:admin", name: "Administrator", email: null, loginMethod: "google", role: "admin", createdAt: now, updatedAt: now, lastSignedIn: now }, req: {} as TrpcContext["req"], res: {} as TrpcContext["res"] };
}

describe("admin access management", () => {
  it("allows an administrator to list users and promote an intended user", async () => {
    mocks.listManagedUsers.mockResolvedValue([{ id: 2, openId: "google:reader", name: "Reader", email: null, loginMethod: "google", role: "user", lastSignedIn: new Date() }]);
    mocks.setManagedUserRole.mockResolvedValue(true);
    const caller = appRouter.createCaller(adminContext());

    await expect(caller.admin.listUsers()).resolves.toHaveLength(1);
    await expect(caller.admin.setUserRole({ openId: "google:reader", role: "admin" })).resolves.toEqual({ success: true });
    expect(mocks.setManagedUserRole).toHaveBeenCalledWith("google:reader", "admin");
  });

  it("prevents an administrator from removing their own administrator role", async () => {
    const caller = appRouter.createCaller(adminContext());
    await expect(caller.admin.setUserRole({ openId: "google:admin", role: "user" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});
