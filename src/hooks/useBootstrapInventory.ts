// src/hooks/useBootstrapInventory.ts
import { useEffect, useRef } from "react";
import { useInventoryService } from "../services";
import { useItemsStore } from "../stores/itemsStore";
import { useLotsStore } from "../stores/lotsStore";
import { useMovementsStore, type Movement } from "../stores/movementsStore";
import { useWorkspaceStore } from "../stores/workspaceStore_";

export function useBootstrapInventory() {
  const bulkItems = useItemsStore((s) => s.bulk);
  const bulkLots = useLotsStore((s) => s.bulk);
  const bulkMovements = useMovementsStore((s) => s.bulk);
  const wsId = useWorkspaceStore((s) => s.currentId);
  const svc = useInventoryService();
  const cancelRef = useRef(false);

  useEffect(() => {
    if (!wsId) return;

    cancelRef.current = false;

    const bootstrap = async () => {
      try {
        const [items, lots, domainMovements] = await Promise.all([
          svc.listItems(),
          svc.listLots(),
          svc.listMovements(),
        ]);

        if (cancelRef.current) return;

        // 도메인 Movement를 스토어 Movement로 변환
        const storeMovements: Movement[] = domainMovements.map((dm: any) => ({
          id: dm.id,
          workspace_id: dm.workspaceId || wsId,
          item_id: dm.itemId,
          type: dm.type,
          qty: dm.qty,
          reason: dm.reason,
          created_at: dm.createdAt || new Date().toISOString(),
        }));

        bulkItems(items);
        bulkLots(lots);
        bulkMovements(storeMovements);
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
