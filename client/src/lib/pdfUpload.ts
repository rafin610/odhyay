import { upload as uploadBlob } from "@vercel/blob/client";
import { vercelBlobUploadsEnabled } from "./vercelBlobUpload";

export type StoredPdf = {
  key: string;
  filename: string;
  mimeType: "application/pdf";
  size: number;
};

const MAX_PDF_UPLOAD_BYTES = 30 * 1024 * 1024;

export async function uploadPdf(file: File): Promise<StoredPdf> {
  if (file.type !== "application/pdf" || !file.name.toLocaleLowerCase().endsWith(".pdf")) {
    throw new Error("Choose a PDF document.");
  }
  if (file.size === 0 || file.size > MAX_PDF_UPLOAD_BYTES) {
    throw new Error("Choose a PDF smaller than 30 MB.");
  }

  if (await vercelBlobUploadsEnabled()) {
    const blob = await uploadBlob(`books/${file.name}`, file, {
      access: "public",
      handleUploadUrl: "/api/admin/uploads/blob",
      clientPayload: JSON.stringify({ kind: "pdf" }),
    });
    return { key: blob.url, filename: file.name, mimeType: "application/pdf", size: file.size };
  }

  const response = await fetch("/api/admin/uploads/pdf", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/pdf",
      "X-File-Name": encodeURIComponent(file.name),
    },
    body: file,
  });
  const payload = await response.json().catch(() => null) as (StoredPdf & { error?: string }) | null;
  if (!response.ok || !payload?.key) throw new Error(payload?.error || "PDF upload could not be completed.");
  return { key: payload.key, filename: payload.filename, mimeType: "application/pdf", size: payload.size };
}
