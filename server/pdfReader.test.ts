import { describe, expect, it } from "vitest";
import { HttpError } from "../shared/_core/errors";
import { loadReaderPdf } from "./pdfReader";
import { firstRouteParameter, routePathParameter } from "./_core/storageProxy";

describe("managed PDF reader delivery", () => {
  it("loads stored PDF bytes through the server-side signed URL path", async () => {
    const result = await loadReaderPdf("qa-book", {
      findBook: async () => ({ pdfKey: "books/1/qa.pdf", pdfFilename: "qa.pdf", pdfMimeType: "application/pdf" } as never),
      getSignedUrl: async () => "https://storage.example/qa.pdf",
      fetchPdf: async () => new Response(Buffer.from("%PDF-1.7\n"), { status: 200 }),
    });
    expect(result).toMatchObject({ mimeType: "application/pdf", filename: "qa.pdf" });
    expect(result.data.subarray(0, 5).toString("ascii")).toBe("%PDF-");
  });

  it("reports missing attachments and storage failures with reader-safe statuses", async () => {
    await expect(loadReaderPdf("missing", { findBook: async () => undefined, getSignedUrl: async () => "", fetchPdf: fetch })).rejects.toMatchObject<HttpError>({ statusCode: 404 });
    await expect(loadReaderPdf("broken", { findBook: async () => ({ pdfKey: "books/1/broken.pdf" } as never), getSignedUrl: async () => "https://storage.example/broken.pdf", fetchPdf: async () => new Response("unavailable", { status: 503 }) })).rejects.toMatchObject<HttpError>({ statusCode: 502 });
  });

  it("normalizes Express 5 route parameter arrays without widening the reader contract", () => {
    expect(firstRouteParameter(["book-slug"])).toBe("book-slug");
    expect(firstRouteParameter("book-slug")).toBe("book-slug");
    expect(firstRouteParameter(undefined)).toBeUndefined();
    expect(routePathParameter(["books", "folder", "book.pdf"])).toBe("books/folder/book.pdf");
  });
});
