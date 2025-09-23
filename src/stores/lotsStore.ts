// src/stores/lotsStore.ts

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { makeNsName } from "../utils/persistNamespace";

export interface Lot {
  id: string;
  workspaceId: string; // 🔧 필수 필드로 변경
  itemId: string;
  quantity: number;
  expiryDate?: string;
  batchNumber?: string;
  receivedDate: string;
  supplier?: string;
  notes?: string;
  createdAt: string;
}

interface LotsState {
  lots: Record<string, Lot>;
  query: string;
}

interface LotsActions {
  addLot: (lot: Omit<Lot, "id" | "createdAt" | "workspaceId">) => Lot;
  updateLot: (
    id: string,
    updates: Partial<Omit<Lot, "id" | "workspaceId">>
  ) => void;
  removeLot: (id: string) => void;
  getLotsByItem: (itemId: string) => Lot[];
  getExpiringLots: (days: number) => Lot[];
  setQuery: (query: string) => void;
  bulk: (lots: Lot[]) => void;
  reset: () => void;
  getWorkspaceLots: () => Lot[];
}

type LotsStore = LotsState & LotsActions;

// 🔧 워크스페이스 ID 가져오기 함수
const getCurrentWorkspaceId = (): string | null => {
  try {
    const workspaceStorage = localStorage.getItem("inventory-workspaces");
    if (workspaceStorage) {
      const parsed = JSON.parse(workspaceStorage);
      const workspaceId = parsed?.state?.currentWorkspaceId;
      console.log("LotsStore getCurrentWorkspaceId:", workspaceId);
      return workspaceId;
    }
  } catch (e) {
    console.error("워크스페이스 ID 가져오기 실패:", e);
  }
  return null;
};

export const useLotsStore = create<LotsStore>()(
  persist(
    (set, get) => ({
      lots: {},
      query: "",

      addLot: (lotData) => {
        const currentWorkspaceId = getCurrentWorkspaceId();
        if (!currentWorkspaceId) {
          console.error("현재 워크스페이스를 찾을 수 없습니다!");
          throw new Error("워크스페이스를 선택해주세요.");
        }

        const lot: Lot = {
          ...lotData,
          id: globalThis.crypto?.randomUUID?.() ?? `lot_${Date.now()}`,
          workspaceId: currentWorkspaceId,
          createdAt: new Date().toISOString(),
        };

        console.log(
          "새 로트 생성:",
          lot.id,
          "워크스페이스:",
          currentWorkspaceId
        );
        set((state) => ({ lots: { ...state.lots, [lot.id]: lot } }));
        return lot;
      },

      updateLot: (id, updates) => {
        set((state) => {
          const lot = state.lots[id];
          if (!lot) return state;

          return {
            lots: { ...state.lots, [id]: { ...lot, ...updates } },
          };
        });
      },

      removeLot: (id) => {
        set((state) => {
          const newLots = { ...state.lots };
          delete newLots[id];
          return { lots: newLots };
        });
      },

      getWorkspaceLots: () => {
        const currentWorkspaceId = getCurrentWorkspaceId();
        if (!currentWorkspaceId) {
          console.log("현재 워크스페이스 ID가 없어서 빈 배열 반환");
          return [];
        }

        const allLots = get().lots;
        const workspaceLots = Object.values(allLots).filter(
          (lot) => lot.workspaceId === currentWorkspaceId
        );

        console.log(
          `현재 워크스페이스(${currentWorkspaceId})의 로트: ${workspaceLots.length}개`
        );
        return workspaceLots;
      },

      getLotsByItem: (itemId) => {
        const workspaceLots = get().getWorkspaceLots();
        return workspaceLots.filter((lot) => lot.itemId === itemId);
      },

      getExpiringLots: (days) => {
        const workspaceLots = get().getWorkspaceLots();
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + days);

        return workspaceLots.filter((lot) => {
          if (!lot.expiryDate) return false;
          const expiryDate = new Date(lot.expiryDate);
          return expiryDate <= futureDate && expiryDate >= new Date();
        });
      },

      setQuery: (query) => set({ query }),

      bulk: (lots) => {
        const validLots = lots.filter((lot) => lot.workspaceId);
        console.log("로트 bulk:", validLots.length, "개");
        set(() => ({
          lots: Object.fromEntries(validLots.map((lot) => [lot.id, lot])),
        }));
      },

      reset: () => set({ lots: {}, query: "" }),
    }),
    {
      name: makeNsName("lots"),
      storage: createJSONStorage(() => localStorage),
      version: 3,
      partialize: (state) => ({ lots: state.lots }),
    }
  )
);

// 🔧 워크스페이스 변경 이벤트 리스너
window.addEventListener("workspace-changed", (event: any) => {
  console.log("로트 스토어: 워크스페이스 변경 감지", event.detail);
  const newWorkspaceId = event.detail?.workspaceId;
  if (newWorkspaceId) {
    const lots = useLotsStore.getState().getWorkspaceLots();
    console.log("워크스페이스 변경 후 로트 데이터:", lots.length, "개");
  }
});
