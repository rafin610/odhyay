import { randomUUID } from "node:crypto";
import type { Express, Request, Response } from "express";
import { HttpError } from "../shared/_core/errors";
import { sdk } from "./_core/sdk";
import { hasSameOrigin } from "./pdfUpload";
import { storagePut } from "./storage";

export const MAX_COVER_UPLOAD_BYTES = 8 * 1024 * 1024;

export type CoverMimeType = "image/jpeg" | "image/png" | "image/webp";

export function detectCoverMimeType(data: Buffer): CoverMimeType | null {
  if (data.length >= 3 && data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff) return "image/jpeg";
  if (data.length >= 8 && data.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (data.length >= 12 && data.subarray(0, 4).toString("ascii") === "RIFF" && data.subarray(8, 12).toString("ascii") === "WEBP") return "image/webp";
  return null;
}

function extensionFor(mimeType: CoverMimeType) {
  return mimeType === "image/jpeg" ? "jpg" : mimeType === "image/png" ? "png" : "webp";
}

export function safeCoverFilename(value: string | undefined, mimeType: CoverMimeType) {
  const decoded = value ? decodeURIComponent(value) : "cover";
  const cleaned = decoded
    .replace(/\.{2,}/g, "-")
    .replace(/[^A-Za-z0-9._ -]/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "")
    .slice(0, 180);
  const base = cleaned.replace(/\.(?:jpe?g|png|webp)$/i, "").replace(/^[-.]+|[-.]+$/g, "");
  return `${base || "cover"}.${extensionFor(mimeType)}`;
}

export function coverUploadErrorStatus(error: unknown) {
  if (error instanceof HttpError) return error.statusCode;
  if (error instanceof Error && /image|smaller than/.test(error.message)) return 400;
  return 500;
}

async function readCoverBody(req: Request) {
  const contentLength = Number(req.get("content-length") ?? 0);
  if (!Number.isFinite(contentLength) || contentLength <= 0 || contentLength > MAX_COVER_UPLOAD_BYTES) throw new Error("Choose an image smaller than 8 MB.");

  const chunks: Buffer[] = [];
  let received = 0;
  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    received += buffer.length;
    if (received > MAX_COVER_UPLOAD_BYTES) throw new Error("Choose an image smaller than 8 MB.");
    chunks.push(buffer);
  }
  const data = Buffer.concat(chunks);
  const mimeType = detectCoverMimeType(data);
  if (!mimeType) throw new Error("Choose a JPEG, PNG, or WebP image.");
  return { data, mimeType };
}

export function registerCoverUploadRoute(app: Express) {
  app.post("/api/admin/uploads/cover", async (req: Request, res: Response) => {
    try {
      if (!hasSameOrigin(req)) {
        res.status(403).json({ error: "Invalid upload origin." });
        return;
      }
      const user = await sdk.authenticateRequest(req);
      if (user.role !== "admin") {
        res.status(403).json({ error: "Administrator access is required." });
        return;
      }
      const declaredType = req.get("content-type")?.split(";")[0] ?? "";
      if (!(["image/jpeg", "image/png", "image/webp"] as string[]).includes(declaredType)) {
        res.status(415).json({ error: "Only JPEG, PNG, and WebP images can be uploaded." });
        return;
      }
      const { data, mimeType } = await readCoverBody(req);
      if (declaredType !== mimeType) {
        res.status(400).json({ error: "The image file type does not match its contents." });
        return;
      }
      const filename = safeCoverFilename(req.get("x-file-name") ?? undefined, mimeType);
      const { key, url } = await storagePut(`covers/${user.id}/${randomUUID()}-${filename}`, data, mimeType);
      res.status(201).json({ key, url, filename, mimeType, size: data.length });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Cover upload failed.";
      const status = coverUploadErrorStatus(error);
      console.error("[Cover upload] Failed", error);
      res.status(status).json({ error: message });
    }
  });
}
