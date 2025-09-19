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
  get visible(): Movement[];
};

type Actions = {
  add: (m: Movement) => void;
  addMany: (ms: Movement[]) => void;
  bulk: (ms: Movement[]) => void; // 배열로 전체 대체
  bulkMovs: (ms: Movement[]) => void; // 레거시 호환 alias
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

const base: StateCreator<Store, [], []> = (set, get) => ({
  byId: {},
  query: "",
  get visible() {
    const q = get().query.trim().toLowerCase();
    const list = Object.values(get().byId).sort((a, b) =>
      b.created_at.localeCompare(a.created_at)
    );
    return q ? list.filter((m) => m.reason?.toLowerCase().includes(q)) : list;
  },
  add: (m) => set((s) => ({ byId: { ...s.byId, [m.id]: m } })),
  addMany: (ms) =>
    set((s) => ({
      byId: { ...s.byId, ...Object.fromEntries(ms.map((m) => [m.id, m])) },
    })),
  bulk: (ms) =>
    set(() => ({
      byId: Object.fromEntries(ms.map((m) => [m.id, m])),
    })),
  bulkMovs: (ms) =>
    set(() => ({
      byId: Object.fromEntries(ms.map((m) => [m.id, m])),
    })),
  create: ({ itemId, type, qty, reason }) => {
    const wsId = useWorkspaceStore.getState().activeWsId;
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
    set((s) => ({ byId: { ...s.byId, [movement.id]: movement } }));
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
      return { byId: next };
    }),
  reset: () => set({ byId: {} }),
  setQuery: (q) => set({ query: q }),
});

export const useMovementsStore = create<Store>()(
  nsPersist<Store>("movements", {
    partialize: (s) => ({ byId: (s as Store).byId } as Partial<Store>),
  })(base)
);

useWorkspaceStore.subscribe(() => {
  (useMovementsStore as any).persist?.setOptions({
    name: makeNsName("movements"),
  });
});
