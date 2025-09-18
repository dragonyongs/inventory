import { create } from "zustand";
import type { Lot } from "../types/domain";

type State = { lots: Record<string, Lot> };
type Actions = {
  bulk: (lots: Lot[]) => void;
  replaceMany: (lots: Lot[]) => void;
};
export const useLotsStore = create<State & Actions>((set) => ({
  lots: {},
  bulk: (lots) =>
    set(() => ({ lots: Object.fromEntries(lots.map((l) => [l.id, l])) })),
  replaceMany: (lots) =>
    set((s) => {
      const next = new Map(Object.entries(s.lots));
      lots.forEach((l) => next.set(l.id, l));
      return { lots: Object.fromEntries(next) };
    }),
}));
