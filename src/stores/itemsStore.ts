// src/stores/itemsStore.ts
import { create } from "zustand";

export interface Item {
  id: string;
  name: string;
  sku?: string;
  barcode?: string;
  stock: number;
  category?: string;
}

interface ItemsState {
  items: Record<string, Item>;
  query: string;
}

interface ItemsActions {
  upsert: (item: Item) => void;
  bulk: (items: Item[]) => void;
  setQuery: (query: string) => void;
}

type ItemsStore = ItemsState & ItemsActions;

export const useItemsStore = create<ItemsStore>()((set) => ({
  items: {},
  query: "",

  upsert: (item) =>
    set((state) => ({
      items: { ...state.items, [item.id]: item },
    })),

  bulk: (items) =>
    set(() => ({
      items: Object.fromEntries(items.map((item) => [item.id, item])),
    })),

  setQuery: (query) => set({ query }),
}));
