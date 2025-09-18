// src/services/db/memoryAdapter.ts
import type { InventoryService } from "./InventoryService";
import type { Item, Lot, Movement } from "../../types/domain";

export function createMemoryAdapter(seed?: {
  items?: Item[];
  lots?: Lot[];
  movements?: Movement[];
}): InventoryService {
  const items = new Map<string, Item>();
  const lots = new Map<string, Lot>();
  const movements: Movement[] = [];
  seed?.items?.forEach((i) => items.set(i.id, i));
  seed?.lots?.forEach((l) => lots.set(l.id, l));
  seed?.movements?.forEach((m) => movements.push(m));

  return {
    async listItems() {
      return [...items.values()];
    },
    async listLots() {
      return [...lots.values()];
    },
    async listMovements() {
      return [...movements];
    },
    async upsertItem(item) {
      items.set(item.id, item);
    },
    async upsertLot(lot) {
      lots.set(lot.id, lot);
    },
    async createMovement(m) {
      movements.push(m);
    },
  };
}
