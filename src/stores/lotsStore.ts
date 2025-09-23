// src/stores/lotsStore.ts

import { create } from "zustand";
import { createWorkspacePersist } from "./persistNamespace";

export interface Lot {
  id: string;
  itemId: string;
  qty: number;
  expiresAt?: string;
  batchNumber?: string;
  createdAt: string;
  workspaceId: string; // 🔧 워크스페이스 ID 추가
}

interface LotsState {
  lots: Record<string, Lot>;
}

interface LotsActions {
  addLot: (lot: Omit<Lot, "id" | "createdAt" | "workspaceId">) => Lot;
  updateLot: (
    id: string,
    updates: Partial<Omit<Lot, "id" | "workspaceId">>
  ) => void;
  removeLot: (id: string) => void;
  getLotsByItem: (itemId: string) => Lot[];
  getTotalQty: (itemId: string) => number;
  getExpiringSoon: (itemId: string, days: number) => Lot[];
  reset: () => void;
  bulk: (lots: Lot[]) => void;
  getWorkspaceLots: () => Lot[];
}

type LotsStore = LotsState & LotsActions;

// 🔧 워크스페이스별 현재 ID를 가져오는 유틸리티 함수
const getCurrentWorkspaceId = (): string | null => {
  try {
    const workspaceStorage = localStorage.getItem("workspace-storage");
    if (workspaceStorage) {
      const parsed = JSON.parse(workspaceStorage);
      return parsed?.state?.currentWorkspaceId;
    }
  } catch (e) {
    console.error("워크스페이스 ID 가져오기 실패:", e);
  }
  return null;
};

const initialState: LotsState = {
  lots: {},
};

export const useLotsStore = create<LotsStore>()(
  createWorkspacePersist<LotsStore>("lots")((set, get) => ({
    ...initialState,

    addLot: (lotData) => {
      const currentWorkspaceId = getCurrentWorkspaceId();

      if (!currentWorkspaceId) {
        console.error("현재 워크스페이스 ID를 찾을 수 없습니다!");
        throw new Error("워크스페이스를 선택해주세요.");
      }

      const lot: Lot = {
        id:
          globalThis.crypto?.randomUUID?.() ??
          `lot_${Date.now()}_${Math.random()}`,
        createdAt: new Date().toISOString(),
        workspaceId: currentWorkspaceId, // 🔧 현재 워크스페이스 ID 할당
        ...lotData,
      };

      console.log("✅ 로트 추가:", lot.id, "워크스페이스:", currentWorkspaceId);

      set((state) => ({
        lots: {
          ...state.lots,
          [lot.id]: lot,
        },
      }));

      return lot;
    },

    updateLot: (id, updates) =>
      set((state) => ({
        lots: {
          ...state.lots,
          [id]: state.lots[id]
            ? { ...state.lots[id], ...updates }
            : state.lots[id],
        },
      })),

    removeLot: (id) =>
      set((state) => {
        const { [id]: removed, ...rest } = state.lots;
        return { lots: rest };
      }),

    getLotsByItem: (itemId) => {
      const workspaceLots = get().getWorkspaceLots();
      return workspaceLots.filter((lot) => lot.itemId === itemId);
    },

    getTotalQty: (itemId) => {
      const lots = get().getLotsByItem(itemId);
      return lots.reduce((sum, lot) => sum + lot.qty, 0);
    },

    getExpiringSoon: (itemId, days) => {
      const lots = get().getLotsByItem(itemId);
      const thresholdDate = new Date();
      thresholdDate.setDate(thresholdDate.getDate() + days);

      return lots.filter((lot) => {
        if (!lot.expiresAt) return false;
        return new Date(lot.expiresAt) <= thresholdDate;
      });
    },

    bulk: (lots) => {
      const currentWorkspaceId = getCurrentWorkspaceId();
      if (!currentWorkspaceId) {
        console.warn("워크스페이스 ID가 없어서 bulk 작업을 건너뜁니다.");
        return;
      }

      // 🔧 워크스페이스 ID가 있는 로트만 필터링
      const validLots = lots.filter(
        (lot) => lot.workspaceId === currentWorkspaceId
      );
      console.log("로트 bulk:", validLots.length, "개");

      set(() => ({
        lots: Object.fromEntries(validLots.map((lot) => [lot.id, lot])),
      }));
    },

    // 🔧 현재 워크스페이스의 로트만 반환
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

    reset: () => set(initialState),
  }))
);

// 🔧 워크스페이스 변경 이벤트 리스너
window.addEventListener("workspace-changed", (event: any) => {
  console.log("로트 스토어: 워크스페이스 변경 감지", event.detail);

  // 새 워크스페이스로 전환 시 강제 리프레시
  const newWorkspaceId = event.detail?.workspaceId;
  if (newWorkspaceId) {
    useLotsStore.getState().getWorkspaceLots();
  }
});
