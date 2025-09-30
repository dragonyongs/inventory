// src/stores/movementsStore.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// ✅ DELETE 타입 추가
export type MovementType =
  | "IN"
  | "OUT"
  | "USE"
  | "ADJUST"
  | "TRANSFER"
  | "DELETE";

// ✅ itemSnapshot 속성 추가
export interface Movement {
  id: string;
  type: MovementType;
  itemId: string;
  qty: number;
  reason?: string;
  createdAt: string;
  userName?: string; // 사용자 이름 (로그인/비로그인 모두)
  userId?: string; // 로그인한 경우 사용자 ID
  userEmail?: string; // 로그인한 경우 이메일
  isSharedAccess?: boolean; // 공유 페이지에서 접근한 경우
  shareToken?: string; // 공유 토큰
  // ✅ 삭제된 아이템 정보 보존용
  itemSnapshot?: {
    name: string;
    sku?: string;
    category?: string;
  };
}

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
}

type MovementsStore = MovementsState & MovementsActions;

// 워크스페이스 ID 가져오기 함수
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

export const useMovementsStore = create<MovementsStore>()(
  persist(
    (set, get) => ({
      byId: {},
      query: "",

      getWorkspaceMovements: () => {
        const currentWorkspaceId = getCurrentWorkspaceId();
        if (!currentWorkspaceId) return [];

        // 현재 워크스페이스의 아이템들과 연결된 움직임만 필터링
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

      initializeWorkspace: (workspaceId) => {
        console.log("움직임 스토어 초기화 (워크스페이스):", workspaceId);
        set((state) => ({ ...state, query: "" }));
      },
    }),
    {
      name: "inventory-movements",
      storage: createJSONStorage(() => localStorage),
      version: 3, // ✅ 버전 업그레이드
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
