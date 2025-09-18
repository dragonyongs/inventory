// tests/fefo.spec.ts
import { describe, it, expect } from "vitest";
import { pickFEFOLot } from "@/services/fefo";

describe("FEFO picking", () => {
  it("picks the earliest expiring lot first", () => {
    const lots = [
      { id: "l1", expires_at: "2025-12-31" },
      { id: "l2", expires_at: "2025-10-01" },
      { id: "l3", expires_at: "2026-01-01" },
    ];
    const picked = pickFEFOLot(lots);
    expect(picked?.id).toBe("l2");
  });
});
