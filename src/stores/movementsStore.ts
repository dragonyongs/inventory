// src/stores/movementsStore.ts
import { create } from "zustand";
import type { StateCreator } from "zustand";
import { nsPersist, makeNsName } from "./persistNamespace";
import { useWorkspaceStore } from "./workspaceStore";
import { useItemsStore } from "./itemsStore";
import { useOutboxStore, type MovementKind } from "./outboxStore";

export type Movement = {
  id: string;
  workspace_id: string;
  item_id: string;
  type: MovementKind;
  qty: number;
  reason?: string;
  created_at: string;
};

type State = {
  byId: Record<string, Movement>;
  query: string;
  visible: Movement[];
};

type Actions = {
  add: (m: Movement) => void;
  addMany: (ms: Movement[]) => void;
  bulk: (ms: Movement[]) => void;
  bulkMovs: (ms: Movement[]) => void;
  create: (p: {
    itemId: string;
    type: MovementKind;
    qty: number;
    reason?: string;
  }) => void;
  remove: (id: string) => void;
  reset: () => void;
  setQuery: (q: string) => void;
};

type Store = State & Actions;

const createMovementsStore: StateCreator<Store, [], [], Store> = (
  set,
  get
) => ({
  byId: {},
  query: "",

  get visible() {
    const q = get().query.trim().toLowerCase();
    const list = Object.values(get().byId).sort((a, b) =>
      b.created_at.localeCompare(a.created_at)
    );
    return q ? list.filter((m) => m.reason?.toLowerCase().includes(q)) : list;
  },

  add: (m) => set((s) => ({ ...s, byId: { ...s.byId, [m.id]: m } })),

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

  bulkMovs: (ms) =>
    set((s) => ({
      ...s,
      byId: Object.fromEntries(ms.map((m) => [m.id, m])),
    })),

  create: ({ itemId, type, qty, reason }) => {
    const wsId = useWorkspaceStore.getState().currentId;
    if (!wsId) return;

    const movement: Movement = {
      id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
      workspace_id: wsId,
      item_id: itemId,
      type,
      qty,
      reason,
      created_at: new Date().toISOString(),
    };

    set((s) => ({ ...s, byId: { ...s.byId, [movement.id]: movement } }));

    const item = useItemsStore.getState().items[itemId] as any;
    if (item && typeof item.stock === "number") {
      const delta = type === "IN" ? qty : type === "OUT" ? -qty : 0;
      useItemsStore
        .getState()
        .upsert({ ...item, stock: Math.max(0, item.stock + delta) });
    }

    useOutboxStore
      .getState()
      .enqueueMovement(
        { workspaceId: wsId, userId: "local-user" },
        { itemId, qty, type, reason }
      );
  },

  remove: (id) =>
    set((s) => {
      const next = { ...s.byId };
      delete next[id];
      return { ...s, byId: next };
    }),

  reset: () => set((s) => ({ ...s, byId: {} })),
  setQuery: (q) => set((s) => ({ ...s, query: q })),
});

export const useMovementsStore = create<Store>()(
  nsPersist("movements", {
    partialize: (s) => ({ byId: s.byId }),
  })(createMovementsStore)
);

useWorkspaceStore.subscribe(() => {
  (useMovementsStore as any).persist?.setOptions({
    name: makeNsName("movements"),
  });
});
