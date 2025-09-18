// src/stores/tests/fefo.test.ts
import { describe, it, expect } from "vitest";

type Lot = { id: string; itemId: string; qty: number; expiresAt?: string };
const fefoPick = (lots: Lot[]) =>
  [...lots]
    .filter((l) => l.qty > 0)
    .sort(
      (a, b) =>
        new Date(a.expiresAt || "9999").getTime() -
        new Date(b.expiresAt || "9999").getTime()
    );

describe("FEFO deduction", () => {
  it("earliest expires first", () => {
    const lots: Lot[] = [
      { id: "L1", itemId: "A", qty: 3, expiresAt: "2025-12-31" },
      { id: "L2", itemId: "A", qty: 3, expiresAt: "2025-10-01" },
    ];
    const order = fefoPick(lots).map((l) => l.id);
    expect(order[0]).toBe("L2");
  });
});
