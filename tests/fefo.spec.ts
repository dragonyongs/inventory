// tests/fefo.spec.ts
import { describe, it, expect } from "vitest";

// FEFO 유틸 함수 - 임시로 인라인 정의
function fefo<T extends { expiryDate?: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    if (!a.expiryDate && !b.expiryDate) return 0;
    if (!a.expiryDate) return 1;
    if (!b.expiryDate) return -1;
    return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
  });
}

type TestItem = {
  id: string;
  name: string;
  expiryDate?: string;
  category: string;
};

describe("FEFO Logic", () => {
  it("should sort items by expiry date (First-Expired, First-Out)", () => {
    const items: TestItem[] = [
      {
        id: "1",
        name: "Milk",
        expiryDate: "2025-10-20",
        category: "Dairy",
      },
      {
        id: "2",
        name: "Bread",
        expiryDate: "2025-10-15",
        category: "Bakery",
      },
      {
        id: "3",
        name: "Juice",
        expiryDate: "2025-11-01",
        category: "Beverages",
      },
      {
        id: "4",
        name: "Yogurt",
        expiryDate: "2025-10-15",
        category: "Dairy",
      },
    ];

    const sortedItems = fefo(items);
    expect(sortedItems[0].name).toBe("Bread");
    expect(sortedItems[1].name).toBe("Yogurt");
    expect(sortedItems[2].name).toBe("Milk");
    expect(sortedItems[3].name).toBe("Juice");
  });
});
