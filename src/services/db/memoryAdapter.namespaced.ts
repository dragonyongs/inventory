import type { InventoryService } from "./InventoryService";
import type { Item, Lot, Movement } from "../../types/domain";

type Store = {
  items: Map<string, Item>;
  lots: Map<string, Lot>;
  movements: Movement[];
};

export function createNamespacedMemory() {
  const byWs = new Map<string, Store>();

  function ensure(ws: string): Store {
    let s = byWs.get(ws);
    if (!s) {
      s = { items: new Map(), lots: new Map(), movements: [] };
      byWs.set(ws, s);
    }
    return s;
  }

  function service(ws: string): InventoryService {
    return {
      async listItems() {
        return [...ensure(ws).items.values()];
      },
      async listLots() {
        return [...ensure(ws).lots.values()];
      },
      async listMovements() {
        return [...ensure(ws).movements];
      },
      async upsertItem(item) {
        ensure(ws).items.set(item.id, item);
      },
      async upsertLot(lot) {
        ensure(ws).lots.set(lot.id, lot);
      },
      async createMovement(m) {
        ensure(ws).movements.push(m);
      },
    };
  }

  return { service, ensure, byWs };
}
