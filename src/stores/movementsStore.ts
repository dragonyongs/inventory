// src/stores/movementsStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type MovementKind = "IN" | "OUT" | "ADJUST" | "TRANSFER" | "USE";

export type Movement = {
  id: string;
  workspaceId?: string;
  itemId: string;
  type: MovementKind;
  qty: number;
  reason?: string;
  actor?: string;
  createdAt: string;
};

type State = {
  byId: Record<string, Movement>;
  query: string;
};

type Actions = {
  add: (m: Movement) => void;
  addMany: (ms: Movement[]) => void;
  bulk: (ms: Movement[]) => void;
  create: (p: {
    itemId: string;
    type: MovementKind;
    qty: number;
    reason?: string;
  }) => Movement;
  remove: (id: string) => void;
  reset: () => void;
  setQuery: (q: string) => void;
  getVisible: () => Movement[];
};

type Store = State & Actions;

export const useMovementsStore = create<Store>()(
  persist(
    (set, get) => ({
      byId: {},
      query: "",

      add: (m) =>
        set((s) => ({
          ...s,
          byId: { ...s.byId, [m.id]: m },
        })),

      addMany: (ms) =>
        set((s) => ({
          ...s,
          byId: { ...s.byId, ...Object.fromEntries(ms.map((m) => [m.id, m])) },
        })),

      bulk: (ms) =>
        set((s) => ({
          ...s,
          byId: Object.fromEntries(ms.map((m) => [m.id, m])),
        })),

      create: ({ itemId, type, qty, reason }) => {
        const movement: Movement = {
          id:
            globalThis.crypto?.randomUUID?.() ??
            `mov_${Date.now()}_${Math.random()}`,
          itemId,
          type,
          qty,
          reason,
          actor: "user",
          createdAt: new Date().toISOString(),
        };

        // Movement 저장
        set((s) => ({
          ...s,
          byId: { ...s.byId, [movement.id]: movement },
        }));

        return movement;
      },

      remove: (id) =>
        set((s) => {
          const next = { ...s.byId };
          delete next[id];
          return { ...s, byId: next };
        }),

      reset: () => set((s) => ({ ...s, byId: {} })),

      setQuery: (q) => set((s) => ({ ...s, query: q })),

      getVisible: () => {
        const state = get();
        const q = state.query.trim().toLowerCase();
        const list = Object.values(state.byId).sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        return q
          ? list.filter((m) => m.reason?.toLowerCase().includes(q))
          : list;
      },
    }),
    {
      name: "movements-storage",
      partialize: (s) => ({ byId: s.byId }),
    }
  )
);
