import { describe, expect, it } from "vitest";
import { HttpError } from "../shared/_core/errors";
import { hasSameOrigin, isPdfBytes, pdfUploadErrorStatus, safePdfFilename } from "./pdfUpload";

describe("PDF upload validation", () => {
  it("accepts genuine PDF bytes and rejects other file signatures", () => {
    expect(isPdfBytes(Buffer.from("%PDF-1.7\n"))).toBe(true);
    expect(isPdfBytes(Buffer.from("not a PDF"))).toBe(false);
  });

  it("normalizes uploaded file names without retaining path characters", () => {
    expect(safePdfFilename("../../বাংলা বই?.PDF")).toBe("PDF.pdf");
    expect(safePdfFilename("reading-copy")).toBe("reading-copy.pdf");
  });

  it("requires an exact same-origin browser request", () => {
    const sameOriginRequest = { get: (key: string) => key === "origin" ? "https://odhyay.example" : key === "host" ? "odhyay.example" : undefined, headers: {} };
    const foreignRequest = { get: (key: string) => key === "origin" ? "https://attacker.example" : key === "host" ? "odhyay.example" : undefined, headers: {} };
    expect(hasSameOrigin(sameOriginRequest as never)).toBe(true);
    expect(hasSameOrigin(foreignRequest as never)).toBe(false);
  });

  it("preserves explicit authentication and permission response codes", () => {
    expect(pdfUploadErrorStatus(new HttpError(401, "Invalid session cookie"))).toBe(401);
    expect(pdfUploadErrorStatus(new HttpError(403, "Administrator access is required"))).toBe(403);
    expect(pdfUploadErrorStatus(new Error("The selected file is not a valid PDF document."))).toBe(400);
  });
});
