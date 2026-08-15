import { randomUUID } from "node:crypto";
import type { Express, Request, Response } from "express";
import { storagePut } from "./storage.js";
import { sdk } from "./_core/sdk.js";
import { HttpError } from "../shared/_core/errors.js";

export const MAX_PDF_UPLOAD_BYTES = 30 * 1024 * 1024;

export function safePdfFilename(value: string | undefined) {
  const decoded = value ? decodeURIComponent(value) : "book.pdf";
  const cleaned = decoded
    .replace(/\.{2,}/g, "-")
    .replace(/[^A-Za-z0-9._ -]/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "")
    .slice(0, 180);
  const base = cleaned.replace(/\.pdf$/i, "").replace(/^[-.]+|[-.]+$/g, "");
  return base ? `${base}.pdf` : "book.pdf";
}

export function isPdfBytes(data: Buffer) {
  return data.length >= 5 && data.subarray(0, 5).toString("ascii") === "%PDF-";
}

function requestHost(req: Request) {
  const forwarded = req.headers["x-forwarded-host"];
  const raw = Array.isArray(forwarded) ? forwarded[0] : forwarded ?? req.get("host") ?? "";
  return raw.split(",")[0].trim();
}

export function hasSameOrigin(req: Request) {
  const origin = req.get("origin");
  const host = requestHost(req);
  if (!origin || !host) return false;
  try {
    const parsed = new URL(origin);
    const local = parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";
    return parsed.host === host && (parsed.protocol === "https:" || local);
  } catch {
    return false;
  }
}

export function pdfUploadErrorStatus(error: unknown) {
  if (error instanceof HttpError) return error.statusCode;
  if (error instanceof Error && /valid PDF|smaller than/.test(error.message)) return 400;
  return 500;
}

async function readPdfBody(req: Request) {
  const contentLength = Number(req.get("content-length") ?? 0);
  if (!Number.isFinite(contentLength) || contentLength <= 0 || contentLength > MAX_PDF_UPLOAD_BYTES) throw new Error("Choose a PDF smaller than 30 MB.");
  const chunks: Buffer[] = [];
  let received = 0;
  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    received += buffer.length;
    if (received > MAX_PDF_UPLOAD_BYTES) throw new Error("Choose a PDF smaller than 30 MB.");
    chunks.push(buffer);
  }
  const data = Buffer.concat(chunks);
  if (!isPdfBytes(data)) throw new Error("The selected file is not a valid PDF document.");
  return data;
}

export function registerPdfUploadRoute(app: Express) {
  app.post("/api/admin/uploads/pdf", async (req: Request, res: Response) => {
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
      if (req.get("content-type")?.split(";")[0] !== "application/pdf") {
        res.status(415).json({ error: "Only PDF documents can be uploaded." });
        return;
      }
      const data = await readPdfBody(req);
      const filename = safePdfFilename(req.get("x-file-name") ?? undefined);
      const { key, url } = await storagePut(`books/${user.id}/${randomUUID()}-${filename}`, data, "application/pdf");
      res.status(201).json({ key, url, filename, mimeType: "application/pdf", size: data.length });
    } catch (error) {
      const message = error instanceof Error ? error.message : "PDF upload failed.";
      const status = pdfUploadErrorStatus(error);
      console.error("[PDF upload] Failed", error);
      res.status(status).json({ error: message });
    }
  });
}
