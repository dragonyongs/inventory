// src/stores/lotsStore.ts - 수정된 버전
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { makeNsName } from "../utils/persistNamespace";

export interface Lot {
  id: string;
  workspaceId: string;
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
  // 로트 관리
  addLot: (lot: Omit<Lot, "id" | "createdAt">) => void;
  updateLot: (id: string, updates: Partial<Lot>) => void;
  deleteLot: (id: string) => void;

  // 조회
  getLotsByItem: (itemId: string) => Lot[];
  getLotsByWorkspace: (workspaceId: string) => Lot[];

  // 검색
  setQuery: (query: string) => void;

  // 정리
  clearAllLots: () => void;
}

type LotsStore = LotsState & LotsActions;

export const useLotsStore = create<LotsStore>()(
  persist(
    (set, get) => ({
      // 초기 상태
      lots: {},
      query: "",

      // 로트 추가
      addLot: (lotData) => {
        const id = globalThis.crypto?.randomUUID?.() ?? `lot_${Date.now()}`;
        const lot: Lot = {
          ...lotData,
          id,
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          lots: {
            ...state.lots,
            [id]: lot,
          },
        }));

        console.log("✅ 로트 추가:", lot);
      },

      // 로트 업데이트
      updateLot: (id, updates) => {
        set((state) => {
          if (!state.lots[id]) {
            console.warn("❌ 존재하지 않는 로트:", id);
            return state;
          }

          const updatedLot = { ...state.lots[id], ...updates };
          console.log("✅ 로트 업데이트:", { id, updates, updatedLot });

          return {
            lots: {
              ...state.lots,
              [id]: updatedLot,
            },
          };
        });
      },

      // 로트 삭제
      deleteLot: (id) => {
        set((state) => {
          if (!state.lots[id]) {
            console.warn("❌ 존재하지 않는 로트:", id);
            return state;
          }

          const { [id]: deleted, ...remainingLots } = state.lots;
          console.log("✅ 로트 삭제:", deleted);

          return { lots: remainingLots };
        });
      },

      // 아이템별 로트 조회
      getLotsByItem: (itemId) => {
        const { lots } = get();
        return Object.values(lots).filter((lot) => lot.itemId === itemId);
      },

      // 워크스페이스별 로트 조회
      getLotsByWorkspace: (workspaceId) => {
        const { lots } = get();
        return Object.values(lots).filter(
          (lot) => lot.workspaceId === workspaceId
        );
      },

      // 검색 쿼리 설정
      setQuery: (query) => {
        set({ query });
      },

      // 모든 로트 정리
      clearAllLots: () => {
        console.log("🗑️ 모든 로트 정리");
        set({ lots: {}, query: "" });
      },
    }),
    {
      name: makeNsName("lots"),
      storage: createJSONStorage(() => localStorage),
      version: 1,
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error("❌ 로트 스토어 복원 실패:", error);
        } else {
          console.log(
            "✅ 로트 스토어 복원 완료:",
            state?.lots ? Object.keys(state.lots).length : 0,
            "개"
          );
        }
      },
    }
  )
);
