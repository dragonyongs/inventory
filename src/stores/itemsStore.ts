import { create } from "zustand";
import type { StateCreator } from "zustand";
import type { Item } from "../types/domain";
import { nsPersist, makeNsName } from "./persistNamespace";
import { useWorkspaceStore } from "./workspaceStore";

type State = {
  items: Record<string, Item>;
  query: string;
  lowStockThreshold: number;
  get visibleItems(): Item[];
};

type Actions = {
  upsert: (item: Item) => void;
  bulk: (items: Item[]) => void;
  remove: (id: string) => void;
  reset: () => void;
  setQuery: (q: string) => void;
  setLowStockThreshold: (n: number) => void;
};

type Store = State & Actions;

const base: StateCreator<Store, [], []> = (set, get) => ({
  items: {},
  query: "",
  lowStockThreshold: 5,
  get visibleItems() {
    const { items, query } = get();
    const list = Object.values(items);
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (it) =>
        it.name.toLowerCase().includes(q) || it.sku.toLowerCase().includes(q)
    );
  },
  upsert: (item) => set((s) => ({ items: { ...s.items, [item.id]: item } })),
  bulk: (items) =>
    set(() => ({ items: Object.fromEntries(items.map((i) => [i.id, i])) })),
  remove: (id) =>
    set((s) => {
      const next = { ...s.items };
      delete next[id];
      return { items: next };
    }),
  reset: () => set({ items: {} }),
  setQuery: (q) => set({ query: q }),
  setLowStockThreshold: (n) => set({ lowStockThreshold: n }),
});

export const useItemsStore = create<Store>()(
  nsPersist<Store>("items", {
    // persist only the raw items; derived getter is not persisted
    partialize: (s) => ({ items: (s as Store).items } as Partial<Store>),
  })(base)
);

// when workspace changes, rotate the persist namespace key
useWorkspaceStore.subscribe(() => {
  (useItemsStore as any).persist?.setOptions({ name: makeNsName("items") });
});
