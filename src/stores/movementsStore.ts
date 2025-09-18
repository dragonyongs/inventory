import { create } from "zustand";
import type { StateCreator } from "zustand";
import type { Movement } from "../types/domain";
import { nsPersist, makeNsName } from "./persistNamespace";
import { useWorkspaceStore } from "./workspaceStore";

type State = { movements: Movement[] };
type Actions = {
  push: (m: Movement) => void;
  bulk: (m: Movement[]) => void;
  reset: () => void;
};
type Store = State & Actions;

const base: StateCreator<Store, [], []> = (set) => ({
  movements: [],
  push: (m) => set((s) => ({ movements: [...s.movements, m].slice(-500) })), // 최근 500건 [web:256]
  bulk: (m) => set(() => ({ movements: m.slice(-500) })),
  reset: () => set({ movements: [] }),
});

export const useMovementsStore = create<Store>()(
  nsPersist<Store>("movements", {
    partialize: (s) =>
      ({ movements: (s as Store).movements } as Partial<Store>),
  })(base)
);

// 전환 시 키 갱신
useWorkspaceStore.subscribe(() => {
  (useMovementsStore as any).persist?.setOptions({
    name: makeNsName("movements"),
  });
});
