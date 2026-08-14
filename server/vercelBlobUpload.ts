import type { Express, Request, Response } from "express";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { sdk } from "./_core/sdk";
import { hasSameOrigin } from "./pdfUpload";

type UploadKind = "cover" | "pdf";

const uploadRules: Record<UploadKind, { allowedContentTypes: string[]; maximumSizeInBytes: number; directory: string }> = {
  cover: { allowedContentTypes: ["image/jpeg", "image/png", "image/webp"], maximumSizeInBytes: 8 * 1024 * 1024, directory: "covers" },
  pdf: { allowedContentTypes: ["application/pdf"], maximumSizeInBytes: 30 * 1024 * 1024, directory: "books" },
};

export function isVercelBlobEnabled() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN || (process.env.BLOB_STORE_ID && process.env.VERCEL_OIDC_TOKEN));
}

function toWebRequest(req: Request) {
  const protocol = req.protocol || "https";
  const host = req.get("host") || "localhost";
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (Array.isArray(value)) headers.set(key, value.join(", "));
    else if (value !== undefined) headers.set(key, value);
  }
  return new Request(`${protocol}://${host}${req.originalUrl}`, { method: req.method, headers, body: JSON.stringify(req.body) });
}

function uploadKind(clientPayload: string | null): UploadKind {
  try {
    const parsed = JSON.parse(clientPayload || "{}") as { kind?: unknown };
    if (parsed.kind === "cover" || parsed.kind === "pdf") return parsed.kind;
  } catch {
    // Fall through to the safe rejection below.
  }
  throw new Error("Unsupported upload type.");
}

export function registerVercelBlobUploadRoute(app: Express) {
  app.get("/api/admin/uploads/blob", async (_req: Request, res: Response) => {
    res.status(200).json({ enabled: isVercelBlobEnabled() });
  });

  app.post("/api/admin/uploads/blob", async (req: Request, res: Response) => {
    if (!isVercelBlobEnabled()) {
      res.status(503).json({ error: "Vercel Blob storage is not configured." });
      return;
    }
    try {
      const body = req.body as HandleUploadBody;
      if (body.type === "blob.generate-client-token" && !hasSameOrigin(req)) {
        res.status(403).json({ error: "Invalid upload origin." });
        return;
      }
      const response = await handleUpload({
        body,
        request: toWebRequest(req),
        onBeforeGenerateToken: async (pathname, clientPayload) => {
          const user = await sdk.authenticateRequest(req);
          if (user.role !== "admin") throw new Error("Administrator access is required.");
          const kind = uploadKind(clientPayload);
          const rule = uploadRules[kind];
          if (!pathname.startsWith(`${rule.directory}/`)) throw new Error("Invalid upload path.");
          return {
            allowedContentTypes: rule.allowedContentTypes,
            maximumSizeInBytes: rule.maximumSizeInBytes,
            addRandomSuffix: true,
            tokenPayload: JSON.stringify({ kind, userId: user.id }),
          };
        },
        onUploadCompleted: async () => undefined,
      });
      res.status(200).json(response);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Upload authorization could not be completed.";
      res.status(400).json({ error: message });
    }
  });
}
