// src/services/db/InventoryService.ts
import type { Item, Lot, Movement } from "../../types/domain";

export interface InventoryService {
  listItems(): Promise<Item[]>;
  listLots(): Promise<Lot[]>;
  listMovements(): Promise<Movement[]>;
  upsertItem(item: Item): Promise<void>;
  upsertLot(lot: Lot): Promise<void>;
  createMovement(m: Movement): Promise<void>;
}
