import { afterEach, describe, expect, it, vi } from "vitest";
import { isTrustedVercelBlobUrl, storageGetSignedUrl } from "./storage";

const originalVercel = process.env.VERCEL;

afterEach(() => {
  vi.unstubAllEnvs();
  if (originalVercel === undefined) delete process.env.VERCEL; else process.env.VERCEL = originalVercel;
});

describe("Vercel Blob reader URL protection", () => {
  it("accepts only HTTPS URLs from the public Vercel Blob host", () => {
    expect(isTrustedVercelBlobUrl("https://store.public.blob.vercel-storage.com/books/guide.pdf")).toBe(true);
    expect(isTrustedVercelBlobUrl("http://store.public.blob.vercel-storage.com/books/guide.pdf")).toBe(false);
    expect(isTrustedVercelBlobUrl("https://example.com/books/guide.pdf")).toBe(false);
    expect(isTrustedVercelBlobUrl("not-a-url")).toBe(false);
  });

  it("rejects arbitrary absolute URLs when running on Vercel", async () => {
    vi.stubEnv("VERCEL", "1");

    await expect(storageGetSignedUrl("https://example.com/private.pdf")).rejects.toThrow("approved Vercel Blob URL");
    await expect(storageGetSignedUrl("https://store.public.blob.vercel-storage.com/books/guide.pdf")).resolves.toBe(
      "https://store.public.blob.vercel-storage.com/books/guide.pdf",
    );
  });
});
