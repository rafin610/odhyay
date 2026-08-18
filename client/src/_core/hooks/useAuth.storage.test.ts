import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("useAuth browser-storage synchronization", () => {
  it("keeps localStorage writes out of render computation and protects unavailable storage", async () => {
    const source = await readFile(new URL("./useAuth.ts", import.meta.url), "utf8");

    expect(source).toContain("useEffect(() => {");
    expect(source).toContain("try {");
    expect(source).toContain('localStorage.setItem(\n        "manus-runtime-user-info"');
    expect(source).not.toContain("useMemo(() => {\n    localStorage.setItem");
  });
});
