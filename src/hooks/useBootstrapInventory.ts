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
  const bulkMovs = useMovementsStore((s) => s.bulkMovs);
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

        // 취소되었으면 상태 업데이트 건너뛰기
        if (cancelRef.current) return;

        bulkItems(items);
        bulkLots(lots);
        bulkMovs(movs);
      } catch (error) {
        if (!cancelRef.current) {
          console.error("[useBootstrapInventory] bootstrap failed:", error);
        }
      }
    };

    bootstrap();

    // cleanup: 다음 wsId 변경 시 이전 요청 취소
    return () => {
      cancelRef.current = true;
    };
  }, [wsId]); // 의존성은 wsId만 유지 [web:17][web:11]
}
