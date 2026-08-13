import "@testing-library/jest-dom/vitest";
import React from "react";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const { getDocument, renderPdfPage } = vi.hoisted(() => ({ getDocument: vi.fn(), renderPdfPage: vi.fn() }));

vi.mock("pdfjs-dist", () => ({
  GlobalWorkerOptions: {},
  getDocument,
}));

vi.mock("pdfjs-dist/build/pdf.worker.min.mjs?url", () => ({ default: "/mock-pdf-worker.js" }));

import { PdfDocument } from "./PdfDocument";

const makeLoadingTask = (promise: Promise<unknown>) => ({ promise, destroy: vi.fn() });

afterEach(() => {
  cleanup();
  getDocument.mockReset();
  renderPdfPage.mockReset();
});

describe("PdfDocument", () => {
  it("loads a managed same-origin PDF, reports its page count, and renders the requested canvas page", async () => {
    renderPdfPage.mockReturnValue({ promise: Promise.resolve(), cancel: vi.fn() });
    getDocument.mockReturnValue(makeLoadingTask(Promise.resolve({
      numPages: 2,
      getPage: vi.fn().mockResolvedValue({
        getViewport: vi.fn().mockReturnValue({ width: 600, height: 840 }),
        render: renderPdfPage,
      }),
    })));
    Object.defineProperty(HTMLCanvasElement.prototype, "getContext", { configurable: true, value: vi.fn(() => ({})) });
    const onPageCount = vi.fn();

    render(<PdfDocument url="/api/reader/pdf/qa-book" pageNumber={2} zoom={1} onPageCount={onPageCount} />);

    await waitFor(() => expect(onPageCount).toHaveBeenCalledWith(2));
    await waitFor(() => expect(renderPdfPage).toHaveBeenCalledOnce());
    expect(getDocument).toHaveBeenCalledWith({ url: "/api/reader/pdf/qa-book", withCredentials: true });
    expect(screen.getByLabelText("PDF page 2")).toBeInTheDocument();
    expect(screen.queryByText("Rendering page…")).not.toBeInTheDocument();
  });

  it("shows the unavailable-document fallback when the managed reader endpoint fails", async () => {
    let rejectDocument: (reason: Error) => void = () => undefined;
    const pendingDocument = new Promise<unknown>((_resolve, reject) => { rejectDocument = reject; });
    getDocument.mockReturnValue(makeLoadingTask(pendingDocument));
    Object.defineProperty(HTMLCanvasElement.prototype, "getContext", { configurable: true, value: vi.fn(() => ({})) });

    render(<PdfDocument url="/api/reader/pdf/missing" pageNumber={1} zoom={1} onPageCount={vi.fn()} />);
    rejectDocument(new Error("No PDF is attached to this book."));

    expect(await screen.findByText("No reader document is attached to this book.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open the PDF in a new tab" })).toHaveAttribute("href", "/api/reader/pdf/missing");
  });
});
