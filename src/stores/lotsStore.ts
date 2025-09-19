// src/stores/lotsStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Lot {
  id: string;
  itemId: string;
  qty: number;
  expiresAt?: string;
  batchNumber?: string;
  receivedAt?: string;
}

interface LotsState {
  lots: Record<string, Lot>;
}

interface LotsActions {
  replaceMany: (lots: Lot[]) => void;
  bulk: (lots: Lot[]) => void;
  addLot: (lot: Lot) => void;
  updateLot: (id: string, updates: Partial<Lot>) => void;
  removeLot: (id: string) => void;
}

type LotsStore = LotsState & LotsActions;

export const useLotsStore = create<LotsStore>()(
  persist(
    (set) => ({
      lots: {},

      replaceMany: (lots) =>
        set(() => ({
          lots: Object.fromEntries(lots.map((lot) => [lot.id, lot])),
        })),

      bulk: (lots) =>
        set(() => ({
          lots: Object.fromEntries(lots.map((lot) => [lot.id, lot])),
        })),

      addLot: (lot) =>
        set((state) => ({
          lots: { ...state.lots, [lot.id]: lot },
        })),

      updateLot: (id, updates) =>
        set((state) => {
          const lot = state.lots[id];
          if (!lot) return state;
          return {
            lots: {
              ...state.lots,
              [id]: { ...lot, ...updates },
            },
          };
        }),

      removeLot: (id) =>
        set((state) => {
          const newLots = { ...state.lots };
          delete newLots[id];
          return { lots: newLots };
        }),
    }),
    {
      name: "lots-storage",
    }
  )
);
