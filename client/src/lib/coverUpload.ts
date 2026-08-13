export type StoredCover = {
  key: string;
  url: string;
  filename: string;
  mimeType: "image/jpeg" | "image/png" | "image/webp";
  size: number;
};

const MAX_COVER_UPLOAD_BYTES = 8 * 1024 * 1024;
const ACCEPTED_COVER_TYPES = new Set<StoredCover["mimeType"]>(["image/jpeg", "image/png", "image/webp"]);

export async function uploadCover(file: File): Promise<StoredCover> {
  if (!ACCEPTED_COVER_TYPES.has(file.type as StoredCover["mimeType"])) {
    throw new Error("Choose a JPEG, PNG, or WebP image.");
  }
  if (file.size === 0 || file.size > MAX_COVER_UPLOAD_BYTES) {
    throw new Error("Choose an image smaller than 8 MB.");
  }

  const response = await fetch("/api/admin/uploads/cover", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": file.type,
      "X-File-Name": encodeURIComponent(file.name),
    },
    body: file,
  });
  const payload = await response.json().catch(() => null) as (StoredCover & { error?: string }) | null;
  if (!response.ok || !payload?.key || !payload.url) throw new Error(payload?.error || "Cover upload could not be completed.");
  return { key: payload.key, url: payload.url, filename: payload.filename, mimeType: payload.mimeType, size: payload.size };
}
