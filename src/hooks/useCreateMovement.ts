// src/hooks/useCreateMovement.ts

import { useCallback } from "react";
import { useMovementsStore, type MovementKind } from "../stores/movementsStore";
import { useItemsStore } from "../stores/itemsStore";
import { useWorkspaceStore } from "../stores/workspaceStore";

export interface CreateMovementParams {
  itemId: string;
  type: MovementKind;
  qty: number;
  reason?: string;
  note?: string;
}

export const useCreateMovement = () => {
  const createMovement = useMovementsStore((state) => state.create);
  const adjustStock = useItemsStore((state) => state.adjustStock);
  const getCurrentWorkspace = useWorkspaceStore(
    (state) => state.getCurrentWorkspace
  );

  return useCallback(
    (params: CreateMovementParams) => {
      console.log("🔄 이동 생성:", params);

      // 🔧 워크스페이스 검증 추가
      const currentWorkspace = getCurrentWorkspace();
      if (!currentWorkspace) {
        const error = new Error("워크스페이스를 선택해주세요.");
        console.error("❌ 이동 생성 실패: 워크스페이스 없음");
        throw error;
      }

      // 🔧 매개변수 검증
      if (!params.itemId || !params.type || params.qty <= 0) {
        const error = new Error("필수 매개변수가 누락되었거나 잘못되었습니다.");
        console.error("❌ 이동 생성 실패: 잘못된 매개변수", params);
        throw error;
      }

      try {
        // 🔧 이동 기록 생성 (워크스페이스 ID는 내부에서 자동 할당)
        const movement = createMovement({
          itemId: params.itemId,
          type: params.type,
          qty: params.qty,
          reason: params.reason || `${params.type} 이동`,
          note: params.note,
        });

        // 🔧 재고 조정 (IN은 증가, 나머지는 감소)
        const delta = params.type === "IN" ? params.qty : -params.qty;
        adjustStock(params.itemId, delta);

        console.log("✅ 이동 생성 완료:", {
          movementId: movement.id,
          workspaceId: movement.workspaceId,
          itemId: params.itemId,
          type: params.type,
          qty: params.qty,
          stockDelta: delta,
        });

        return movement;
      } catch (error) {
        console.error("❌ 이동 생성 실패:", error);

        // 🔧 더 구체적인 에러 메시지 제공
        if (error instanceof Error) {
          if (error.message.includes("워크스페이스")) {
            throw new Error(
              "워크스페이스를 선택해주세요. 사이드바에서 워크스페이스를 확인하거나 설정에서 새로 생성하세요."
            );
          }
        }

        throw error;
      }
    },
    [createMovement, adjustStock, getCurrentWorkspace]
  );
};

// 🆕 특정 이동 타입을 위한 편의 훅들
export const useCreateInMovement = () => {
  const createMovement = useCreateMovement();

  return useCallback(
    (params: Omit<CreateMovementParams, "type">) => {
      return createMovement({
        ...params,
        type: "IN",
        reason: params.reason || "입고",
      });
    },
    [createMovement]
  );
};

export const useCreateOutMovement = () => {
  const createMovement = useCreateMovement();

  return useCallback(
    (params: Omit<CreateMovementParams, "type">) => {
      return createMovement({
        ...params,
        type: "OUT",
        reason: params.reason || "출고",
      });
    },
    [createMovement]
  );
};

export const useCreateAdjustMovement = () => {
  const createMovement = useCreateMovement();

  return useCallback(
    (params: Omit<CreateMovementParams, "type">) => {
      return createMovement({
        ...params,
        type: "ADJUST",
        reason: params.reason || "재고 조정",
      });
    },
    [createMovement]
  );
};

export const useCreateUseMovement = () => {
  const createMovement = useCreateMovement();

  return useCallback(
    (params: Omit<CreateMovementParams, "type">) => {
      return createMovement({
        ...params,
        type: "USE",
        reason: params.reason || "사용",
      });
    },
    [createMovement]
  );
};

// 🆕 배치 이동 생성을 위한 훅
export const useCreateBatchMovements = () => {
  const createMovement = useCreateMovement();

  return useCallback(
    async (movements: CreateMovementParams[]) => {
      console.log("🔄 배치 이동 생성:", movements.length, "개");

      const results = [];
      const errors = [];

      for (const movementData of movements) {
        try {
          const movement = createMovement(movementData);
          results.push(movement);
        } catch (error) {
          console.error("❌ 배치 이동 중 실패:", movementData, error);
          errors.push({ data: movementData, error });
        }
      }

      console.log(
        `✅ 배치 이동 완료: 성공 ${results.length}개, 실패 ${errors.length}개`
      );

      return {
        success: results,
        errors: errors,
        totalCount: movements.length,
        successCount: results.length,
        errorCount: errors.length,
      };
    },
    [createMovement]
  );
};

// 🆕 디버깅용 훅 (개발 환경에서만)
export const useMovementDebugger = () => {
  const movementsStore = useMovementsStore();
  const itemsStore = useItemsStore();
  const workspaceStore = useWorkspaceStore();

  return {
    getCurrentWorkspace: () => workspaceStore.getCurrentWorkspace(),
    getWorkspaceMovements: () => movementsStore.getWorkspaceMovements(),
    getWorkspaceItems: () => itemsStore.getWorkspaceItems(),
    logStoreStates: () => {
      console.log("🐛 Store States Debug:", {
        currentWorkspace: workspaceStore.getCurrentWorkspace(),
        movementsCount: movementsStore.getWorkspaceMovements().length,
        itemsCount: itemsStore.getWorkspaceItems().length,
      });
    },
  };
};

// 🆕 개발 환경에서 전역으로 디버깅 도구 제공
if (typeof window !== "undefined" && import.meta.env.DEV) {
  (window as any).debugMovements = {
    useCreateMovement,
    useMovementDebugger,
  };
}
