import { describe, it, expect } from "vitest";
import { fefo } from "@/utils/fefo";
import type { Item } from "@/types/domain";

describe("FEFO Logic", () => {
  it("should sort items by expiry date (First-Expired, First-Out)", () => {
    const items: Item[] = [
      {
        id: "1",
        name: "Milk",
        quantity: 1,
        expiryDate: "2025-10-20",
        category: "Dairy",
      },
      {
        id: "2",
        name: "Bread",
        quantity: 1,
        expiryDate: "2025-10-15",
        category: "Bakery",
      },
      {
        id: "3",
        name: "Juice",
        quantity: 1,
        expiryDate: "2025-11-01",
        category: "Beverages",
      },
      {
        id: "4",
        name: "Yogurt",
        quantity: 1,
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
