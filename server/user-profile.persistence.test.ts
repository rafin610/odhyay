import { afterEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { users } from "../drizzle/schema";
import { getDb, getUserByOpenId, upsertUser } from "./db";

const openId = `google:profile-sync-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;

afterEach(async () => {
  const db = await getDb();
  if (db) await db.delete(users).where(eq(users.openId, openId));
});

describe("user profile persistence", () => {
  it("retains Google profile fields during a later session-only refresh and accepts profile updates", async () => {
    await upsertUser({ openId, name: "Initial reader", email: "initial@example.com", loginMethod: "google" });
    await upsertUser({ openId, lastSignedIn: new Date() });

    expect(await getUserByOpenId(openId)).toMatchObject({
      openId,
      name: "Initial reader",
      email: "initial@example.com",
      loginMethod: "google",
    });

    await upsertUser({ openId, name: "Updated reader", email: "updated@example.com", loginMethod: "google" });
    expect(await getUserByOpenId(openId)).toMatchObject({
      openId,
      name: "Updated reader",
      email: "updated@example.com",
      loginMethod: "google",
    });
  });
});
