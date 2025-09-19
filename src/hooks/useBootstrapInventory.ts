// src/hooks/useBootstrapInventory.ts
import { useEffect, useRef } from "react";
import { useInventoryService } from "../services";
import { useItemsStore, type Item as StoreItem } from "../stores/itemsStore";
import { useLotsStore } from "../stores/lotsStore";
import {
  useMovementsStore,
  type Movement,
  type MovementKind,
} from "../stores/movementsStore";
import { useWorkspaceStore } from "../stores/workspaceStore";
import type { Item as DomainItem } from "../types/domain";

interface DomainMovement {
  id: string;
  workspaceId?: string;
  itemId: string;
  type: MovementKind;
  qty: number;
  reason?: string;
  createdAt?: string;
}

export function useBootstrapInventory() {
  const bulkItems = useItemsStore((s: any) => s.bulk);
  const bulkLots = useLotsStore((s: any) => s.bulk);
  const bulkMovements = useMovementsStore((s: any) => s.bulk);
  const wsId = useWorkspaceStore((s: any) => s.currentId);
  const svc = useInventoryService();
  const cancelRef = useRef(false);

  useEffect(() => {
    if (!wsId) return;

    cancelRef.current = false;

    const bootstrap = async () => {
      try {
        const [domainItems, lots, domainMovements] = await Promise.all([
          svc.listItems(),
          svc.listLots(),
          svc.listMovements(),
        ]);

        if (cancelRef.current) return;

        // 도메인 Item을 스토어 Item으로 변환 (stock 필드 추가)
        const storeItems: StoreItem[] = domainItems.map((item: DomainItem) => ({
          ...item,
          stock: item.stock ?? 0,
          createdAt: item.createdAt || new Date().toISOString(),
        }));

        // 도메인 Movement를 스토어 Movement로 변환
        const storeMovements: Movement[] = domainMovements.map(
          (dm: DomainMovement) => ({
            id: dm.id,
            workspaceId: dm.workspaceId || wsId,
            itemId: dm.itemId,
            type: dm.type,
            qty: dm.qty,
            reason: dm.reason,
            createdAt: dm.createdAt || new Date().toISOString(),
          })
        );

        bulkItems(storeItems);
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
