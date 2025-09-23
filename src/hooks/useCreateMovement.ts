// src/hooks/useCreateMovement.ts

import { useCallback } from "react";
import { useMovementsStore, type MovementKind } from "../stores/movementsStore";
import { useItemsStore } from "../stores/itemsStore";

export const useCreateMovement = () => {
  const createMovement = useMovementsStore((state) => state.create);
  const adjustStock = useItemsStore((state) => state.adjustStock);

  return useCallback(
    (params: {
      itemId: string;
      type: MovementKind;
      qty: number;
      reason?: string;
      note?: string;
    }) => {
      console.log("🔄 이동 생성:", params);

      try {
        // 이동 기록 생성 (워크스페이스 ID는 내부에서 자동 할당)
        const movement = createMovement(params);

        // 재고 조정
        const delta = params.type === "IN" ? params.qty : -params.qty;
        adjustStock(params.itemId, delta);

        console.log("✅ 이동 생성 완료:", movement.id, `재고 변화: ${delta}`);
        return movement;
      } catch (error) {
        console.error("❌ 이동 생성 실패:", error);
        throw error;
      }
    },
    [createMovement, adjustStock]
  );
};
