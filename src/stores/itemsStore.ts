// src/stores/itemsStore.ts
import { create } from "zustand";
import type { Item } from "../types/domain";

type State = { items: Record<string, Item> };
type Actions = { upsert: (item: Item) => void; bulk: (items: Item[]) => void };
export const useItemsStore = create<State & Actions>((set) => ({
  items: {},
  upsert: (item) => set((s) => ({ items: { ...s.items, [item.id]: item } })),
  bulk: (items) =>
    set(() => ({ items: Object.fromEntries(items.map((i) => [i.id, i])) })),
}));
