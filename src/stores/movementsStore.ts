import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { useActivityStore } from "./activityStore";
import { useAuthStore } from "./authStore";
import { generateId } from "../utils/generateId";

// MovementType 정의 (DELETE 타입 포함)
export type MovementType =
  | "IN"
  | "OUT"
  | "USE"
  | "ADJUST"
  | "TRANSFER"
  | "DELETE";

// Movement 인터페이스
export interface Movement {
  id: string;
  type: MovementType;
  itemId: string;
  qty: number;
  reason?: string;
  createdAt: string;
  userName?: string;
  userId?: string;
  userEmail?: string;
  isSharedAccess?: boolean;
  shareToken?: string;
  itemSnapshot?: {
    name: string;
    sku?: string;
    category?: string;
  };
}

// Movements 상태 및 액션 인터페이스
interface MovementsState {
  byId: Record<string, Movement>;
  query: string;
}

interface MovementsActions {
  addMovement: (movement: Movement) => void;
  removeMovement: (id: string) => void;
  bulk: (movements: Movement[]) => void;
  setQuery: (query: string) => void;
  reset: () => void;
  getWorkspaceMovements: () => Movement[];
  initializeWorkspace: (workspaceId: string) => void;
  clearMovements: () => void;
}

type MovementsStore = MovementsState & MovementsActions;

// 워크스페이스 ID 가져오는 함수
const getCurrentWorkspaceId = (): string | null => {
  try {
    const workspaceStorage = localStorage.getItem("inventory-workspaces");
    if (!workspaceStorage) return null;

    const parsed = JSON.parse(workspaceStorage);
    return parsed.state?.currentWorkspaceId || null;
  } catch (e) {
    console.error("워크스페이스 ID 가져오기 실패:", e);
    return null;
  }
};

// Activity 타입과 불일치 문제 해결을 위한 변환 함수
const movementTypeMap: Record<MovementType, string> = {
  IN: "INBOUND",
  OUT: "OUTBOUND",
  USE: "USE",
  ADJUST: "ADJUST",
  TRANSFER: "TRANSFER",
  DELETE: "DELETE",
};

export const useMovementsStore = create<MovementsStore>()(
  persist(
    (set, get) => ({
      byId: {},
      query: "",

      getWorkspaceMovements: () => {
        const currentWorkspaceId = getCurrentWorkspaceId();
        if (!currentWorkspaceId) return [];

        try {
          const itemsStorage = localStorage.getItem("inventory-items");
          if (!itemsStorage) return [];

          const itemsData = JSON.parse(itemsStorage);
          const workspaceItemIds = Object.values(itemsData.state?.items || {})
            .filter((item: any) => item.workspaceId === currentWorkspaceId)
            .map((item: any) => item.id);

          const allMovements = Object.values(get().byId);
          return allMovements.filter((movement) =>
            workspaceItemIds.includes(movement.itemId)
          );
        } catch (e) {
          console.error("워크스페이스 움직임 조회 실패:", e);
          return Object.values(get().byId);
        }
      },

      addMovement: (movement) => {
        console.log("✅ 움직임 추가:", {
          id: movement.id,
          type: movement.type,
          itemId: movement.itemId,
          qty: movement.qty,
          reason: movement.reason,
          userName: movement.userName,
          isSharedAccess: movement.isSharedAccess,
          hasSnapshot: !!movement.itemSnapshot,
        });

        set((state) => ({
          byId: { ...state.byId, [movement.id]: movement },
        }));

        // 활동 로그 추가 부분
        const user = useAuthStore.getState().user;

        if (user && user.role) {
          const activityType = movementTypeMap[movement.type];
          useActivityStore.getState().addActivity({
            id: generateId(),
            type: activityType as any,
            movement: {
              id: movement.id,
              itemId: movement.itemId,
              quantity: movement.qty,
              beforeQty: 0, // 실제 이전 재고는 별도 로직 필요
              afterQty: 0, // 실제 이후 재고도 별도 로직 필요
              movementType: activityType as any,
              createdBy: user.id,
              createdAt: movement.createdAt,
              reason: movement.reason,
              warehouseId: "", // 필요시 창고정보 추가
              note: undefined,
            },
            user,
            itemId: movement.itemId,
            itemName: movement.itemSnapshot?.name || "",
            change:
              movement.type === "OUT" ||
              movement.type === "USE" ||
              movement.type === "DELETE"
                ? -movement.qty
                : movement.qty,
            beforeQty: 0,
            afterQty: 0,
            actionTime: movement.createdAt,
            location: "",
            reason: movement.reason,
            memo: undefined,
          });
        }
      },

      removeMovement: (id) => {
        set((state) => {
          const newById = { ...state.byId };
          delete newById[id];
          return { byId: newById };
        });
      },

      bulk: (movements) => {
        const movementsRecord = movements.reduce((acc, movement) => {
          acc[movement.id] = movement;
          return acc;
        }, {} as Record<string, Movement>);

        set((state) => ({
          byId: { ...state.byId, ...movementsRecord },
        }));
      },

      setQuery: (query) => set({ query }),

      reset: () => set({ byId: {}, query: "" }),

      // ✅ 이 메서드 추가
      clearMovements: () => {
        console.log("🧹 모든 움직임 데이터 삭제");
        set({ byId: {}, query: "" });
      },

      initializeWorkspace: (workspaceId) => {
        console.log("움직임 스토어 초기화 (워크스페이스):", workspaceId);
        set((state) => ({ ...state, query: "" }));
      },
    }),
    {
      name: "inventory-movements",
      storage: createJSONStorage(() => localStorage),
      version: 3,
      partialize: (state) => ({ byId: state.byId }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          console.log("✅ 움직임 스토어 rehydrate 완료");
          const movementCount = Object.keys(state.byId).length;
          const deleteMovements = Object.values(state.byId).filter(
            (m) => m.type === "DELETE"
          );
          const sharedMovements = Object.values(state.byId).filter(
            (m) => m.isSharedAccess
          );
          console.log(
            `총 움직임: ${movementCount}개, 삭제: ${deleteMovements.length}개, 공유: ${sharedMovements.length}개`
          );
        }
      },
    }
  )
);

// 워크스페이스 변경 이벤트 리스너
window.addEventListener("workspace-changed", (event: any) => {
  console.log("움직임 스토어: 워크스페이스 변경 감지", event.detail);
  const newWorkspaceId = event.detail?.workspaceId;
  if (newWorkspaceId) {
    useMovementsStore.getState().initializeWorkspace(newWorkspaceId);
  }
});
