// src/hooks/useCreateMovement.ts - 수정된 버전
import { useCallback } from "react";
import { useMovementsStore, type MovementType } from "../stores/movementsStore";
import { useItemsStore } from "../stores/itemsStore";
import { useAuthStore } from "@/stores/authStore";
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
  const setStock = useItemsStore((s) => s.setStock);
  const updateItem = useItemsStore((s) => s.updateItem); // ✅ updateItem 사용
  // const items = useItemsStore((s) => s.items);
  const currentWorkspaceId = useWorkspaceStore((s) => s.currentWorkspaceId);
  const user = useAuthStore((s) => s.user);

  return useCallback(
    async (params: CreateMovementParams) => {
      console.log("🔧 createMovement 시작:", params);

      if (!currentWorkspaceId) {
        throw new Error("활성 워크스페이스가 없습니다");
      }

      if (!params.itemId || !params.type || params.qty <= 0) {
        throw new Error("필수 파라미터가 누락되었거나 잘못되었습니다");
      }

      try {
        const items = useItemsStore.getState().items;
        const item = items[params.itemId];
        if (!item) {
          throw new Error("아이템을 찾을 수 없습니다");
        }

        // 1. Movement 기록 생성
        const movementId =
          globalThis.crypto?.randomUUID?.() ?? `movement-${Date.now()}`;

        const movement = {
          id: movementId,
          itemId: params.itemId,
          type: params.type,
          qty: params.qty,
          userName: user?.name || user?.email?.split("@")[0] || undefined,
          userId: user?.id,
          userEmail: user?.email,
          reason:
            params.reason ||
            (params.type === "IN"
              ? "입고"
              : params.type === "OUT"
              ? "출고"
              : "조정"),
          note: params.note,
          createdAt: new Date().toISOString(),
          workspaceId: currentWorkspaceId,
          itemSnapshot: {
            name: item.name,
            sku: item.sku,
            category: item.category,
          },
        };

        console.log("🔄 addMovement 호출:", movement);
        addMovement(movement);
        console.log("✅ 움직임 추가 완료");

        // 2. 재고 조정 (Movement 생성 없이)
        if (params.type === "ADJUST" && params.isAbsoluteValue) {
          console.log(`🔄 setStock 호출: ${params.itemId} → ${params.qty}`);
          setStock(params.itemId, params.qty);
        } else {
          // ✅ adjustStock 대신 updateItem 직접 사용 (Movement 중복 방지)
          const delta = params.type === "IN" ? params.qty : -params.qty;
          const newStock = Math.max(0, item.stock + delta);

          console.log(`🔄 재고 직접 업데이트: ${item.stock} → ${newStock}`);

          updateItem(params.itemId, {
            stock: newStock,
            // 입고 시 maxStock 업데이트
            ...(delta > 0 && {
              maxStock: (item.maxStock || 0) + delta,
            }),
          });
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
    [addMovement, setStock, updateItem, currentWorkspaceId, user]
  );
};
