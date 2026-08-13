import { describe, expect, it } from "vitest";
import { HttpError } from "../shared/_core/errors";
import { coverUploadErrorStatus, detectCoverMimeType, safeCoverFilename } from "./coverUpload";

describe("cover image upload validation", () => {
  it("identifies accepted image signatures and rejects unsupported bytes", () => {
    expect(detectCoverMimeType(Buffer.from([0xff, 0xd8, 0xff, 0xe0]))).toBe("image/jpeg");
    expect(detectCoverMimeType(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe("image/png");
    expect(detectCoverMimeType(Buffer.from("RIFFxxxxWEBPVP8 "))).toBe("image/webp");
    expect(detectCoverMimeType(Buffer.from("not an image"))).toBeNull();
  });

  it("normalizes file names and assigns the detected image extension", () => {
    expect(safeCoverFilename("../../বাংলা cover.PNG", "image/png")).toBe("cover.png");
    expect(safeCoverFilename("portrait", "image/jpeg")).toBe("portrait.jpg");
  });

  it("preserves authentication and validation response statuses", () => {
    expect(coverUploadErrorStatus(new HttpError(401, "Invalid session cookie"))).toBe(401);
    expect(coverUploadErrorStatus(new HttpError(403, "Administrator access is required"))).toBe(403);
    expect(coverUploadErrorStatus(new Error("Choose a JPEG, PNG, or WebP image."))).toBe(400);
  });
});
