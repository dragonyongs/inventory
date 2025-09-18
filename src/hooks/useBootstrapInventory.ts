import { useEffect } from "react";
import { inventoryService } from "../services";
import { useItemsStore } from "../stores/itemsStore";
import { useLotsStore } from "../stores/lotsStore";
import { useMovementsStore } from "../stores/movementsStore";

export function useBootstrapInventory() {
  const bulkItems = useItemsStore((s) => s.bulk);
  const bulkLots = useLotsStore((s) => s.bulk);
  const bulkMovs = useMovementsStore((s) => s.bulk);

  useEffect(() => {
    (async () => {
      const [items, lots, movs] = await Promise.all([
        inventoryService.listItems(),
        inventoryService.listLots(),
        inventoryService.listMovements(),
      ]);
      bulkItems(items);
      bulkLots(lots);
      bulkMovs(movs);
    })();
  }, [bulkItems, bulkLots, bulkMovs]);
}
