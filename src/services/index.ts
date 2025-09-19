// src/services/index.ts
import type { Item, Lot } from "../types/domain";

export const useInventoryService = () => ({
  listItems: async (): Promise<Item[]> => {
    // Mock data
    return [
      {
        id: "item-1",
        name: "Test Item",
        sku: "TEST-001",
        category: "Test Category",
        stock: 10,
      },
    ];
  },
  listLots: async (): Promise<Lot[]> => {
    // Mock data
    return [];
  },
  listMovements: async () => {
    // Mock data
    return [];
  },
});
