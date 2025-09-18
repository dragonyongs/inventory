// src/stores/movementsStore.ts
import { create } from "zustand";
import { nanoid } from "nanoid";
import type { Movement, MovementType } from "../types/domain";

type State = { movements: Movement[] };
type Actions = {
  createMovement: (m: Omit<Movement, "id" | "createdAt">) => void;
};
export const useMovementsStore = create<State & Actions>((set) => ({
  movements: [],
  createMovement: (m) =>
    set((s) => ({
      movements: [
        ...s.movements,
        { ...m, id: nanoid(), createdAt: new Date().toISOString() },
      ],
    })),
}));
