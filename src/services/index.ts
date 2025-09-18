import { createMemoryAdapter } from "./db/memoryAdapter";

export const inventoryService = createMemoryAdapter({
  items: [
    {
      id: "I-A",
      name: "Vitamin C 500mg",
      sku: "VC-500",
      minStock: 5,
      barcode: "880000000001",
    },
    {
      id: "I-B",
      name: "Bandage L",
      sku: "BD-L",
      minStock: 10,
      barcode: "880000000002",
    },
  ],
  lots: [
    {
      id: "L-A1",
      itemId: "I-A",
      qty: 5,
      receivedAt: "2025-01-01T00:00:00Z",
      expiresAt: "2025-10-01",
    },
    {
      id: "L-A2",
      itemId: "I-A",
      qty: 3,
      receivedAt: "2025-02-01T00:00:00Z",
      expiresAt: "2025-12-31",
    },
    { id: "L-B1", itemId: "I-B", qty: 20, receivedAt: "2025-03-01T00:00:00Z" },
  ],
});
