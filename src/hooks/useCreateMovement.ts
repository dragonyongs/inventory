// src/hooks/useCreateMovement.ts
import { useCallback } from "react";
import { useMovementsStore, type MovementType } from "../stores/movementsStore";
import { useItemsStore } from "../stores/itemsStore";
import { useWorkspaceStore } from "../stores/workspaceStore";

export interface CreateMovementParams {
  itemId: string;
  type: MovementType;
  qty: number;
  reason?: string;
  note?: string;
  // ✅ 새로 추가: ADJUST 타입을 위한 절대값 설정 모드
  isAbsoluteValue?: boolean;
}

export const useCreateMovement = () => {
  const { addMovement } = useMovementsStore();
  const { adjustStock, setStock } = useItemsStore(); // ✅ setStock 추가
  const { getCurrentWorkspace } = useWorkspaceStore();

  return useCallback(
    async (params: CreateMovementParams) => {
      console.log("✅ createMovement 시작:", params);

      const currentWorkspace = getCurrentWorkspace();
      if (!currentWorkspace) {
        throw new Error("워크스페이스가 선택되지 않았습니다.");
      }

      if (!params.itemId || !params.type || params.qty <= 0) {
        throw new Error("필수 매개변수가 누락되었습니다.");
      }

      try {
        const movementId =
          globalThis.crypto?.randomUUID?.() ?? `movement_${Date.now()}`;

        const movement = {
          id: movementId,
          itemId: params.itemId,
          type: params.type,
          qty: params.qty,
          reason:
            params.reason ||
            `${
              params.type === "IN"
                ? "입고"
                : params.type === "OUT"
                ? "출고"
                : "조정"
            }`,
          createdAt: new Date().toISOString(),
          ...(params.note && { note: params.note }),
        };

        // ✅ 움직임 저장
        addMovement(movement);

        // ✅ 핵심 수정: ADJUST 타입이면서 절대값 모드인 경우 setStock 사용
        if (params.type === "ADJUST" && params.isAbsoluteValue) {
          console.log("✅ 절대값 재고 설정:", {
            itemId: params.itemId,
            newStock: params.qty,
          });
          setStock(params.itemId, params.qty);
        } else {
          // ✅ 기존 로직: 델타 값 적용
          const delta = params.type === "IN" ? params.qty : -params.qty;
          adjustStock(params.itemId, delta);
        }

        console.log("✅ 움직임 생성 완료:", {
          movementId: movement.id,
          itemId: params.itemId,
          type: params.type,
          qty: params.qty,
          isAbsoluteValue: params.isAbsoluteValue,
        });

        return movement;
      } catch (error) {
        console.error("❌ 움직임 생성 실패:", error);
        throw error;
      }
    },
    [addMovement, adjustStock, setStock, getCurrentWorkspace]
  );
};
