import type { Express, Request, Response } from "express";
import { getBookBySlug } from "./db";
import { storageGetSignedUrl } from "./storage";
import { HttpError } from "../shared/_core/errors";

type ReaderPdfDependencies = {
  findBook: typeof getBookBySlug;
  getSignedUrl: typeof storageGetSignedUrl;
  fetchPdf: typeof fetch;
};

const defaultDependencies: ReaderPdfDependencies = {
  findBook: getBookBySlug,
  getSignedUrl: storageGetSignedUrl,
  fetchPdf: fetch,
};

export async function loadReaderPdf(slug: string, dependencies: ReaderPdfDependencies = defaultDependencies) {
  const book = await dependencies.findBook(slug);
  if (!book?.pdfKey) throw new HttpError(404, "No PDF is attached to this book.");

  const signedUrl = await dependencies.getSignedUrl(book.pdfKey);
  const source = await dependencies.fetchPdf(signedUrl);
  if (!source.ok) throw new HttpError(502, "The stored PDF could not be retrieved.");

  return {
    data: Buffer.from(await source.arrayBuffer()),
    mimeType: book.pdfMimeType === "application/pdf" ? "application/pdf" : "application/pdf",
    filename: book.pdfFilename ?? "book.pdf",
  };
}

function readerPdfErrorStatus(error: unknown) {
  return error instanceof HttpError ? error.statusCode : 500;
}

export function registerReaderPdfRoute(app: Express) {
  app.get("/api/reader/pdf/:slug", async (req: Request, res: Response) => {
    try {
      const pdf = await loadReaderPdf(req.params.slug);
      res.set({
        "Cache-Control": "private, no-store",
        "Content-Type": pdf.mimeType,
        "Content-Length": String(pdf.data.length),
        "Content-Disposition": "inline",
      });
      res.status(200).send(pdf.data);
    } catch (error) {
      const message = error instanceof Error ? error.message : "The reader PDF could not be loaded.";
      res.status(readerPdfErrorStatus(error)).json({ error: message });
    }
  });
}
