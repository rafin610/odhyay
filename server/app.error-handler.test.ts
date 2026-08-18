import { describe, expect, it, vi } from "vitest";
import { finalErrorHandler } from "./app";

describe("final Express error handler", () => {
  it("logs the failure and does not disclose the underlying exception", () => {
    const json = vi.fn();
    const status = vi.fn().mockReturnValue({ json });
    const next = vi.fn();
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);

    finalErrorHandler(new Error("database password should stay private"), {} as never, { headersSent: false, status } as never, next);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({ error: "The library could not complete this request. Please try again." });
    expect(next).not.toHaveBeenCalled();
    log.mockRestore();
  });

  it("passes through errors after response headers have started", () => {
    const next = vi.fn();

    finalErrorHandler(new Error("stream error"), {} as never, { headersSent: true } as never, next);

    expect(next).toHaveBeenCalledTimes(1);
  });
});
