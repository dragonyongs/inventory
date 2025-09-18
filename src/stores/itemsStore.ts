import { create } from "zustand";
import type { StateCreator } from "zustand";
import type { Item } from "../types/domain";
import { nsPersist, makeNsName } from "./persistNamespace";
import { useWorkspaceStore } from "./workspaceStore";

type State = { items: Record<string, Item> };
type Actions = {
  upsert: (item: Item) => void;
  bulk: (items: Item[]) => void;
  reset: () => void;
};
type Store = State & Actions;

const base: StateCreator<Store, [], []> = (set) => ({
  items: {},
  upsert: (item) => set((s) => ({ items: { ...s.items, [item.id]: item } })),
  bulk: (items) =>
    set(() => ({ items: Object.fromEntries(items.map((i) => [i.id, i])) })),
  reset: () => set({ items: {} }),
});

export const useItemsStore = create<Store>()(
  nsPersist<Store>("items", {
    partialize: (s) => ({ items: (s as Store).items } as Partial<Store>),
  })(base)
);

useWorkspaceStore.subscribe(() => {
  (useItemsStore as any).persist?.setOptions({ name: makeNsName("items") });
});
