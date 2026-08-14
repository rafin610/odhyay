import { afterEach, describe, expect, it, vi } from "vitest";
import { isVercelBlobEnabled } from "./vercelBlobUpload";

const originalVercel = process.env.VERCEL;
const originalToken = process.env.BLOB_READ_WRITE_TOKEN;
const originalStore = process.env.BLOB_STORE_ID;
const originalOidc = process.env.VERCEL_OIDC_TOKEN;

afterEach(() => {
  vi.unstubAllEnvs();
  if (originalVercel === undefined) delete process.env.VERCEL; else process.env.VERCEL = originalVercel;
  if (originalToken === undefined) delete process.env.BLOB_READ_WRITE_TOKEN; else process.env.BLOB_READ_WRITE_TOKEN = originalToken;
  if (originalStore === undefined) delete process.env.BLOB_STORE_ID; else process.env.BLOB_STORE_ID = originalStore;
  if (originalOidc === undefined) delete process.env.VERCEL_OIDC_TOKEN; else process.env.VERCEL_OIDC_TOKEN = originalOidc;
});

describe("Vercel Blob upload capability", () => {
  it("remains disabled when no Vercel Blob credentials are configured", () => {
    vi.stubEnv("BLOB_READ_WRITE_TOKEN", "");
    vi.stubEnv("BLOB_STORE_ID", "");
    vi.stubEnv("VERCEL_OIDC_TOKEN", "");

    expect(isVercelBlobEnabled()).toBe(false);
  });

  it("enables authorized client-direct uploads for a configured Blob store", () => {
    vi.stubEnv("BLOB_READ_WRITE_TOKEN", "blob_rw_test_token");

    expect(isVercelBlobEnabled()).toBe(true);
  });
});
