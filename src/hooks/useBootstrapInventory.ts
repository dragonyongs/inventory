import { useEffect } from "react";
import { useInventoryService } from "../services";
import { useItemsStore } from "../stores/itemsStore";
import { useLotsStore } from "../stores/lotsStore";
import { useMovementsStore } from "../stores/movementsStore";
import { useWorkspaceStore } from "../stores/workspaceStore";

export function useBootstrapInventory() {
  const bulkItems = useItemsStore((s) => s.bulk);
  const bulkLots = useLotsStore((s) => s.bulk);
  const bulkMovs = useMovementsStore((s) => s.bulk);
  const wsId = useWorkspaceStore((s) => s.currentId);
  const svc = useInventoryService();

  useEffect(() => {
    (async () => {
      const [items, lots, movs] = await Promise.all([
        svc.listItems(),
        svc.listLots(),
        svc.listMovements(),
      ]);
      bulkItems(items);
      bulkLots(lots);
      bulkMovs(movs);
    })();
  }, [svc, wsId, bulkItems, bulkLots, bulkMovs]);
}
