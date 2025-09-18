// src/stores/movementsStore.ts
import { create } from "zustand";
import type { Movement } from "../types/domain";

type State = { movements: Movement[] };
type Actions = {
  createMovement: (m: Movement) => void;
  list: () => Movement[];
};

export const useMovementsStore = create<State & Actions>((set, get) => ({
  movements: [],
  createMovement: (m) => set((s) => ({ movements: [...s.movements, m] })),
  list: () => get().movements,
}));
