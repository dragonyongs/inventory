// src/hooks/useCreateMovement.ts
import { useCallback } from "react";
import { useMovementsStore, type MovementKind } from "../stores/movementsStore";
import { useItemsStore } from "../stores/itemsStore";

export const useCreateMovement = () => {
  const createMovement = useMovementsStore((s) => s.create);
  const adjustStock = useItemsStore((s) => s.adjustStock);

  return useCallback(
    async ({
      itemId,
      type,
      qty,
      reason,
    }: {
      itemId: string;
      type: MovementKind;
      qty: number;
      reason?: string;
    }) => {
      // Movement 생성
      const movement = createMovement({ itemId, type, qty, reason });

      // 재고 조정
      let delta = 0;
      switch (type) {
        case "IN":
          delta = qty;
          break;
        case "OUT":
          delta = -qty;
          break;
        case "ADJUST":
          // ADJUST의 경우 qty가 최종 재고량
          const currentItem = useItemsStore.getState().items[itemId];
          if (currentItem) {
            delta = qty - currentItem.stock;
          }
          break;
        case "TRANSFER":
        case "USE":
          delta = -qty;
          break;
      }

      if (delta !== 0) {
        adjustStock(itemId, delta);
      }

      return movement;
    },
    [createMovement, adjustStock]
  );
};
