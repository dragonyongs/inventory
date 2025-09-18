// src/stores/movementsStore.ts
import { create } from "zustand";
import type { Movement } from "../types/domain";

type State = { movements: Movement[] };
type Actions = { push: (m: Movement) => void; bulk: (m: Movement[]) => void };
export const useMovementsStore = create<State & Actions>((set) => ({
  movements: [],
  push: (m) => set((s) => ({ movements: [...s.movements, m] })),
  bulk: (m) => set(() => ({ movements: m })),
}));
