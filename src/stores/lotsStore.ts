// src/stores/lotsStore.ts
import { create } from "zustand";

export interface Lot {
  id: string;
  itemId: string;
  qty: number;
  expiresAt?: string;
  batchNumber?: string;
}

interface LotsState {
  lots: Record<string, Lot>;
}

interface LotsActions {
  replaceMany: (lots: Lot[]) => void;
  bulk: (lots: Lot[]) => void;
}

type LotsStore = LotsState & LotsActions;

export const useLotsStore = create<LotsStore>()((set) => ({
  lots: {},

  replaceMany: (lots) =>
    set(() => ({
      lots: Object.fromEntries(lots.map((lot) => [lot.id, lot])),
    })),

  bulk: (lots) =>
    set(() => ({
      lots: Object.fromEntries(lots.map((lot) => [lot.id, lot])),
    })),
}));
