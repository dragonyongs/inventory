// src/hooks/useBootstrapInventory.ts
import { useEffect, useRef } from "react";
import { useInventoryService } from "../services";
import { useItemsStore } from "../stores/itemsStore";
import { useLotsStore } from "../stores/lotsStore";
import { useMovementsStore } from "../stores/movementsStore";
import { useWorkspaceStore } from "../stores/workspaceStore";

export function useBootstrapInventory() {
  const bulkItems = useItemsStore((s) => s.bulk);
  const bulkLots = useLotsStore((s) => s.bulk);
  const bulkMovements = useMovementsStore((s) => s.bulk); // bulkMovs -> bulk
  const wsId = useWorkspaceStore((s) => s.currentId);
  const svc = useInventoryService();
  const cancelRef = useRef(false);

  useEffect(() => {
    if (!wsId) return;

    cancelRef.current = false;
    const bootstrap = async () => {
      try {
        const [items, lots, movs] = await Promise.all([
          svc.listItems(),
          svc.listLots(),
          svc.listMovements(),
        ]);
        if (cancelRef.current) return;
        bulkItems(items);
        bulkLots(lots);
        bulkMovements(movs);
      } catch (error) {
        if (!cancelRef.current) {
          console.error("[useBootstrapInventory] bootstrap failed:", error);
        }
      }
    };

    bootstrap();

    return () => {
      cancelRef.current = true;
    };
  }, [wsId, bulkItems, bulkLots, bulkMovements, svc]);
}
