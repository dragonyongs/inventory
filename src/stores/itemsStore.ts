// src/stores/itemsStore.ts

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { makeNsName } from "./persistNamespace";

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
  workspaceId: string;
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
    item: Omit<Item, "id" | "createdAt" | "workspaceId"> & { stock?: number }
  ) => Item;
  hasSku: (sku: string) => boolean;
  updateItem: (
    id: string,
    updates: Partial<Omit<Item, "id" | "workspaceId">>
  ) => void;
  removeItem: (id: string) => void;
  adjustStock: (itemId: string, delta: number) => void;
  setStock: (itemId: string, stock: number) => void;
  reset: () => void;
  getWorkspaceItems: () => Item[];
  // 🔧 워크스페이스별 초기화 함수 추가
  initializeWorkspace: (workspaceId: string) => void;
}

type ItemsStore = ItemsState & ItemsActions;

// 🔧 워크스페이스별 현재 ID를 가져오는 유틸리티 함수
const getCurrentWorkspaceId = (): string | null => {
  try {
    const workspaceStorage = localStorage.getItem("workspace-storage");
    return workspaceStorage
      ? JSON.parse(workspaceStorage).state?.currentWorkspaceId ?? null
      : null;
  } catch (e) {
    console.error("워크스페이스 ID 가져오기 실패:", e);
    return null;
  }
};

export const useItemsStore = create<ItemsStore>()(
  persist(
    (set, get) => ({
      items: {},
      query: "",

      // ✅ `getWorkspaceItems`에 타입 가드 추가
      getWorkspaceItems: () => {
        const currentWorkspaceId = getCurrentWorkspaceId();
        if (!currentWorkspaceId) {
          return [];
        }
        const allItems = get().items;
        // Object.values의 타입을 Item[]으로 명확하게 해주는 것이 핵심
        return Object.values(allItems).filter(
          (item): item is Item =>
            item && item.workspaceId === currentWorkspaceId
        );
      },

      upsert: (item) => {
        if (!item.workspaceId) {
          console.error("❌ 워크스페이스 ID가 없는 아이템:", item);
          return;
        }
        set((state) => ({ items: { ...state.items, [item.id]: item } }));
      },

      addItem: (itemData) => {
        const currentWorkspaceId = getCurrentWorkspaceId();
        if (!currentWorkspaceId) {
          throw new Error("워크스페이스를 선택해주세요.");
        }
        const item: Item = {
          ...itemData,
          id: globalThis.crypto?.randomUUID?.() ?? `item_${Date.now()}`,
          stock: itemData.stock ?? 0,
          createdAt: new Date().toISOString(),
          workspaceId: currentWorkspaceId,
        };
        set((state) => ({ items: { ...state.items, [item.id]: item } }));
        return item;
      },

      // ... 다른 액션들은 그대로 유지 ...

      hasSku: (sku) => {
        return get()
          .getWorkspaceItems()
          .some((item) => item.sku === sku);
      },

      bulk: (items) => {
        const validItems = items.filter((item) => item.workspaceId);
        set(() => ({
          items: Object.fromEntries(validItems.map((item) => [item.id, item])),
        }));
      },

      setQuery: (query) => set({ query }),

      updateItem: (id, updates) => {
        set((state) => {
          const item = state.items[id];
          if (!item) return state;
          const { workspaceId, ...allowedUpdates } = updates as any;
          return {
            items: { ...state.items, [id]: { ...item, ...allowedUpdates } },
          };
        });
      },

      removeItem: (id) => {
        set((state) => {
          const newItems = { ...state.items };
          delete newItems[id];
          return { items: newItems };
        });
      },

      adjustStock: (itemId, delta) => {
        set((state) => {
          const item = state.items[itemId];
          if (!item) return state;
          return {
            items: {
              ...state.items,
              [itemId]: { ...item, stock: Math.max(0, item.stock + delta) },
            },
          };
        });
      },

      setStock: (itemId, stock) => {
        set((state) => {
          const item = state.items[itemId];
          if (!item) return state;
          return {
            items: {
              ...state.items,
              [itemId]: { ...item, stock: Math.max(0, stock) },
            },
          };
        });
      },

      reset: () => {
        set({ items: {}, query: "" });
      },

      initializeWorkspace: (workspaceId) => {
        console.log("아이템 스토어 초기화 (워크스페이스):", workspaceId);
      },
    }),
    {
      name: makeNsName("items"), // 동적 이름 설정
      storage: createJSONStorage(() => localStorage),
      version: 2, // 마이그레이션 버전
      // 필요한 상태만 저장
      partialize: (state) => ({ items: state.items }),
    }
  )
);

// 🔧 워크스페이스 변경 이벤트 리스너 강화
window.addEventListener("workspace-changed", (event: any) => {
  console.log("아이템 스토어: 워크스페이스 변경 감지", event.detail);

  // 새 워크스페이스로 전환 시 강제 리프레시
  const newWorkspaceId = event.detail?.workspaceId;
  if (newWorkspaceId) {
    useItemsStore.getState().initializeWorkspace(newWorkspaceId);
    useItemsStore.getState().getWorkspaceItems();
  }
});
