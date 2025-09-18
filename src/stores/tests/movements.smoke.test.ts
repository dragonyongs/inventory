import { describe, it, expect } from "vitest";
import { create } from "zustand";

type MovementType = "IN" | "OUT" | "ADJUST" | "TRANSFER";
type Movement = {
  id: string;
  type: MovementType;
  itemId: string;
  qty: number;
  createdAt: string;
};

type State = { movements: Movement[] };
type Actions = {
  createMovement: (m: Omit<Movement, "id" | "createdAt">) => void;
};

const useMovementsStore = create<State & Actions>((set) => ({
  movements: [],
  createMovement: (m) =>
    set((s) => ({
      movements: [
        ...s.movements,
        { ...m, id: "t-1", createdAt: "2025-01-01T00:00:00.000Z" },
      ],
    })),
}));

describe("movementsStore smoke", () => {
  it("IN -> 기록 1건 추가", () => {
    const { createMovement } = useMovementsStore.getState();
    createMovement({ type: "IN", itemId: "A", qty: 5 });
    const { movements } = useMovementsStore.getState();
    expect(movements).toHaveLength(1);
    expect(movements[0].type).toBe("IN");
    expect(movements[0].qty).toBe(5);
  });
});
