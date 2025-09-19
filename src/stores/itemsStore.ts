// src/stores/itemsStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Item {
  id: string;
  name: string;
  sku?: string;
  barcode?: string;
  stock: number;
  category?: string;
  minStock?: number;
  defaultPrice?: number;
  createdAt: string;
}

interface ItemsState {
  items: Record<string, Item>;
  query: string;
}

interface ItemsActions {
  upsert: (item: Item) => void;
  bulk: (items: Item[]) => void;
  setQuery: (query: string) => void;
  addItem: (
    item: Omit<Item, "id" | "stock" | "createdAt"> & { stock?: number }
  ) => Item;
  hasSku: (sku: string) => boolean;
  updateItem: (id: string, updates: Partial<Item>) => void;
  removeItem: (id: string) => void;
}

type ItemsStore = ItemsState & ItemsActions;

export const useItemsStore = create<ItemsStore>()(
  persist(
    (set, get) => ({
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

      addItem: (itemData) => {
        const item: Item = {
          id: globalThis.crypto?.randomUUID?.() ?? `item_${Date.now()}`,
          stock: 0,
          createdAt: new Date().toISOString(),
          ...itemData,
        };

        set((state) => ({
          items: { ...state.items, [item.id]: item },
        }));

        return item;
      },

      hasSku: (sku) => {
        const items = get().items;
        return Object.values(items).some((item) => item.sku === sku);
      },

      updateItem: (id, updates) =>
        set((state) => {
          const item = state.items[id];
          if (!item) return state;
          return {
            items: {
              ...state.items,
              [id]: { ...item, ...updates },
            },
          };
        }),

      removeItem: (id) =>
        set((state) => {
          const newItems = { ...state.items };
          delete newItems[id];
          return { items: newItems };
        }),
    }),
    {
      name: "items-storage",
    }
  )
);
