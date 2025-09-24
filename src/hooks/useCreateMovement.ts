// src/hooks/useCreateMovement.ts - 수정된 버전
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
  isAbsoluteValue?: boolean;
}

export const useCreateMovement = () => {
  const addMovement = useMovementsStore((s) => s.addMovement);
  const adjustStock = useItemsStore((s) => s.adjustStock);
  const setStock = useItemsStore((s) => s.setStock);
  // getCurrentWorkspace를 의존성에서 빼기 위해 직접 스토어를 구독
  const currentWorkspaceId = useWorkspaceStore((s) => s.currentWorkspaceId);

  return useCallback(
    async (params: CreateMovementParams) => {
      console.log("🔧 createMovement 시작:", params);

      // getCurrentWorkspace 함수 호출 대신 직접 체크
      if (!currentWorkspaceId) {
        throw new Error("활성 워크스페이스가 없습니다");
      }

      if (!params.itemId || !params.type || params.qty <= 0) {
        throw new Error("필수 파라미터가 누락되었거나 잘못되었습니다");
      }

      try {
        // 1. 이동 기록 생성
        const movementId =
          globalThis.crypto?.randomUUID?.() ?? `movement-${Date.now()}`;
        const movement = {
          id: movementId,
          itemId: params.itemId,
          type: params.type,
          qty: params.qty,
          reason:
            params.reason ||
            (params.type === "IN"
              ? "입고"
              : params.type === "OUT"
              ? "출고"
              : "조정"),
          note: params.note,
          createdAt: new Date().toISOString(),
          workspaceId: currentWorkspaceId, // 함수 호출 대신 직접 사용
        };

        console.log("🔄 addMovement 호출:", movement);
        addMovement(movement);
        console.log("✅ 움직임 추가 완료");

        // 2. 재고 조정
        if (params.type === "ADJUST" && params.isAbsoluteValue) {
          console.log(`🔄 setStock 호출: ${params.itemId} → ${params.qty}`);
          setStock(params.itemId, params.qty);
        } else {
          const delta = params.type === "IN" ? params.qty : -params.qty;
          console.log(`🔄 adjustStock 호출: ${params.itemId} + ${delta}`);
          adjustStock(params.itemId, delta);
        }

        console.log("✅ 재고 조정 완료");

        return {
          movementId,
          itemId: params.itemId,
          type: params.type,
          qty: params.qty,
          isAbsoluteValue: params.isAbsoluteValue,
        };
      } catch (error) {
        console.error("❌ createMovement 내부 오류:", error);
        throw error;
      }
    },
    [addMovement, adjustStock, setStock, currentWorkspaceId]
    // getCurrentWorkspace 함수는 의존성에서 제거
  );
};
