// src/stores/itemsStore.ts

import { create } from "zustand";
import { createWorkspacePersist } from "./persistNamespace";

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
  workspaceId: string; // 워크스페이스 ID 필수
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
    if (workspaceStorage) {
      const parsed = JSON.parse(workspaceStorage);
      return parsed?.state?.currentWorkspaceId;
    }
  } catch (e) {
    console.error("워크스페이스 ID 가져오기 실패:", e);
  }
  return null;
};

export const useItemsStore = create<ItemsStore>()(
  createWorkspacePersist("items")((set, get) => ({
    items: {},
    query: "",

    upsert: (item) => {
      // 🔧 워크스페이스 ID 검증 강화
      if (!item.workspaceId) {
        console.error("❌ 워크스페이스 ID가 없는 아이템:", item);
        return;
      }

      console.log(
        "아이템 upsert:",
        item.name,
        "워크스페이스:",
        item.workspaceId
      );
      set((state) => ({ items: { ...state.items, [item.id]: item } }));
    },

    bulk: (items) => {
      // 🔧 워크스페이스 ID가 있는 아이템만 필터링
      const validItems = items.filter((item) => item.workspaceId);
      console.log("아이템 bulk:", validItems.length, "개");
      set(() => ({
        items: Object.fromEntries(validItems.map((item) => [item.id, item])),
      }));
    },

    setQuery: (query) => set({ query }),

    addItem: (itemData) => {
      const currentWorkspaceId = getCurrentWorkspaceId();

      if (!currentWorkspaceId) {
        console.error("현재 워크스페이스 ID를 찾을 수 없습니다!");
        throw new Error("워크스페이스를 선택해주세요.");
      }

      const item: Item = {
        id: globalThis.crypto?.randomUUID?.() ?? `item_${Date.now()}`,
        stock: itemData.stock ?? 0,
        createdAt: new Date().toISOString(),
        workspaceId: currentWorkspaceId, // 🔧 현재 워크스페이스 ID 할당
        ...itemData,
      };

      console.log(
        "✅ 아이템 추가:",
        item.name,
        "워크스페이스:",
        currentWorkspaceId
      );

      set((state) => ({ items: { ...state.items, [item.id]: item } }));
      return item;
    },

    hasSku: (sku) => {
      const workspaceItems = get().getWorkspaceItems();
      return workspaceItems.some((item) => item.sku === sku);
    },

    updateItem: (id, updates) => {
      console.log("아이템 업데이트:", id, updates);
      set((state) => {
        const item = state.items[id];
        if (!item) {
          console.warn("업데이트할 아이템을 찾을 수 없음:", id);
          return state;
        }

        // 🔧 워크스페이스 ID는 변경되지 않도록 보호
        const { workspaceId, ...allowedUpdates } = updates as any;

        return {
          items: { ...state.items, [id]: { ...item, ...allowedUpdates } },
        };
      });
    },

    removeItem: (id) => {
      console.log("아이템 제거:", id);
      set((state) => {
        const newItems = { ...state.items };
        delete newItems[id];
        return { items: newItems };
      });
    },

    adjustStock: (itemId, delta) => {
      console.log("재고 조정:", itemId, delta);
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
      console.log("재고 설정:", itemId, stock);
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
      console.log("아이템 스토어 리셋");
      set({ items: {}, query: "" });
    },

    // 🔧 현재 워크스페이스의 아이템만 반환
    getWorkspaceItems: () => {
      const currentWorkspaceId = getCurrentWorkspaceId();

      if (!currentWorkspaceId) {
        console.log("현재 워크스페이스 ID가 없어서 빈 배열 반환");
        return [];
      }

      const allItems = get().items;
      const workspaceItems = Object.values(allItems).filter(
        (item) => item.workspaceId === currentWorkspaceId
      );

      console.log(
        `현재 워크스페이스(${currentWorkspaceId})의 아이템: ${workspaceItems.length}개`
      );
      return workspaceItems;
    },

    // 🔧 워크스페이스별 초기화
    initializeWorkspace: (workspaceId) => {
      console.log("워크스페이스 초기화:", workspaceId);
      // 필요시 워크스페이스별 초기 데이터 설정
    },
  }))
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
