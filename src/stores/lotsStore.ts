import { create } from "zustand";
import type { Lot } from "../types/domain";

type State = { lots: Record<string, Lot> };
type Actions = { upsert: (lot: Lot) => void; bulk: (lots: Lot[]) => void };

export const useLotsStore = create<State & Actions>((set) => ({
  lots: {},
  upsert: (lot) => set((s) => ({ lots: { ...s.lots, [lot.id]: lot } })),
  bulk: (lots) =>
    set(() => ({ lots: Object.fromEntries(lots.map((l) => [l.id, l])) })),
}));
