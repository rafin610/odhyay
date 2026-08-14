import { describe, expect, it } from "vitest";
import { usesTiDbPublicEndpoint } from "./db";

describe("TiDB runtime connection detection", () => {
  it("enables the TLS pool path only for TiDB Cloud public endpoints", () => {
    expect(usesTiDbPublicEndpoint("mysql://user:secret@gateway01.ap-northeast-1.prod.aws.tidbcloud.com:4000/odhyay")).toBe(true);
    expect(usesTiDbPublicEndpoint("mysql://user:secret@managed-mysql.internal:3306/odhyay")).toBe(false);
  });
});
