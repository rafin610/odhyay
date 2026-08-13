import { afterEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { users } from "../drizzle/schema";
import { getDb, getUserByOpenId, repairIncompleteGoogleUsers, upsertUser } from "./db";

const runToken = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
const incompleteOpenId = `google:incomplete-${runToken}`;
const completeOpenId = `google:complete-${runToken}`;

afterEach(async () => {
  const db = await getDb();
  if (!db) return;
  await db.delete(users).where(eq(users.openId, incompleteOpenId));
  await db.delete(users).where(eq(users.openId, completeOpenId));
});

describe("Google user metadata repair", () => {
  it("backfills provider metadata and a safe display name without overwriting complete profiles", async () => {
    await upsertUser({ openId: incompleteOpenId, name: null, email: null, loginMethod: null });
    await upsertUser({ openId: completeOpenId, name: "Complete reader", email: "complete@example.com", loginMethod: "google" });

    const result = await repairIncompleteGoogleUsers();
    expect(result.repaired).toBeGreaterThanOrEqual(1);
    expect(result.requiresEmailRecovery).toBeGreaterThanOrEqual(1);
    expect(await getUserByOpenId(incompleteOpenId)).toMatchObject({
      openId: incompleteOpenId,
      name: "Google reader",
      email: null,
      loginMethod: "google",
    });
    expect(await getUserByOpenId(completeOpenId)).toMatchObject({
      openId: completeOpenId,
      name: "Complete reader",
      email: "complete@example.com",
      loginMethod: "google",
    });

    await upsertUser({ openId: incompleteOpenId, name: "Recovered reader", email: "recovered@example.com", loginMethod: "google" });
    expect(await getUserByOpenId(incompleteOpenId)).toMatchObject({
      openId: incompleteOpenId,
      name: "Recovered reader",
      email: "recovered@example.com",
      loginMethod: "google",
    });
  });
});
