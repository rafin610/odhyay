import { describe, expect, it } from "vitest";
import { readerPdfErrorMessage, readerPdfUrl } from "./pdfReader";

describe("reader PDF client helpers", () => {
  it("uses a same-origin endpoint and gives a concise fallback message", () => {
    expect(readerPdfUrl("বাংলা বই")).toBe("/api/reader/pdf/%E0%A6%AC%E0%A6%BE%E0%A6%82%E0%A6%B2%E0%A6%BE%20%E0%A6%AC%E0%A6%87");
    expect(readerPdfErrorMessage(new Error("No PDF is attached to this book."))).toBe("No reader document is attached to this book.");
    expect(readerPdfErrorMessage(new Error("Network failed"))).toBe("The stored document could not be opened here.");
  });
});
