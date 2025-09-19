// tests/fefo.spec.ts
import { describe, it, expect } from "vitest";
import { orderLotsFefo } from "../utils/fefo"; // @/services -> ../utils
import type { Lot } from "../types/domain";

const now = new Date();
const lots: Lot[] = [
  {
    id: "1",
    itemId: "a",
    qty: 10,
    receivedAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + 10 * 86400000).toISOString(),
  },
  {
    id: "2",
    itemId: "a",
    qty: 5,
    receivedAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + 5 * 86400000).toISOString(),
  },
];

describe("FEFO Logic", () => {
  it("should sort lots by expiration date", () => {
    const sorted = orderLotsFefo(lots);
    expect(sorted[0].id).toBe("2");
    expect(sorted[1].id).toBe("1");
  });
});
