// src/stores/itemsStore.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface Item {
  id: string;
  name: string;
  sku?: string;
  barcode?: string;
  stock: number; // ✅ 실제 재고 수량
  category?: string;
  minStock?: number; // ✅ 알림 기준만 (재고에 합산 X)
  defaultPrice?: number;
  createdAt: string;
  workspaceId: string;
  expiryDate?: string;
  batchNumber?: string;
  receivedDate?: string;
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
  initializeWorkspace: (workspaceId: string) => void;
}

type ItemsStore = ItemsState & ItemsActions;

// 워크스페이스 ID 가져오기 함수 (안정성 개선)
const getCurrentWorkspaceId = (): string | null => {
  try {
    const workspaceStorage = localStorage.getItem("inventory-workspaces");
    if (!workspaceStorage) {
      console.warn("워크스페이스 스토리지를 찾을 수 없습니다");
      return "default-workspace"; // 기본값 반환
    }

    const parsed = JSON.parse(workspaceStorage);
    const currentWorkspaceId = parsed.state?.currentWorkspaceId;
    if (!currentWorkspaceId) {
      console.warn("현재 워크스페이스 ID가 없습니다");
      return "default-workspace"; // 기본값 반환
    }

    return currentWorkspaceId;
  } catch (e) {
    console.error("워크스페이스 ID 가져오기 실패:", e);
    return "default-workspace"; // 기본값 반환
  }
};

export const useItemsStore = create<ItemsStore>()(
  persist(
    (set, get) => ({
      items: {},
      query: "",

      getWorkspaceItems: () => {
        const currentWorkspaceId = getCurrentWorkspaceId();
        if (!currentWorkspaceId) {
          console.warn("현재 워크스페이스가 없어 빈 배열을 반환합니다");
          return [];
        }

        const allItems = get().items;
        const workspaceItems = Object.values(allItems).filter(
          (item): item is Item =>
            item && item.workspaceId === currentWorkspaceId
        );

        console.log(
          `워크스페이스 ${currentWorkspaceId}의 아이템:`,
          workspaceItems.length
        );
        return workspaceItems;
      },

      upsert: (item) => {
        if (!item.workspaceId) {
          console.error("❌ 워크스페이스 ID가 없는 아이템:", item);
          return;
        }
        set((state) => ({
          items: { ...state.items, [item.id]: item },
        }));
      },

      addItem: (itemData) => {
        const currentWorkspaceId = getCurrentWorkspaceId();
        if (!currentWorkspaceId) {
          console.error(
            "현재 워크스페이스를 찾을 수 없습니다. 워크스페이스를 먼저 선택해주세요."
          );
          throw new Error(
            "워크스페이스를 선택해주세요. 사이드바에서 워크스페이스를 선택하거나 새로 생성하세요."
          );
        }

        // ✅ 수정: stock은 정확히 전달된 값만 사용
        const item: Item = {
          ...itemData,
          id: globalThis.crypto?.randomUUID?.() ?? `item_${Date.now()}`,
          stock: itemData.stock ?? 0, // ✅ 전달된 값 그대로 사용 (Inventory에서 0 전달)
          createdAt: new Date().toISOString(),
          workspaceId: currentWorkspaceId,
        };

        console.log("✅ 아이템 생성 (addItem):", {
          itemId: item.id,
          name: item.name,
          stock: item.stock, // ✅ 0이어야 정상
          minStock: item.minStock,
        });

        set((state) => ({
          items: { ...state.items, [item.id]: item },
        }));
        return item;
      },

      hasSku: (sku) => {
        return get()
          .getWorkspaceItems()
          .some((item) => item.sku === sku);
      },

      bulk: (items) => {
        const validItems = items.filter((item) => item.workspaceId);
        const itemsRecord = validItems.reduce((acc, item) => {
          acc[item.id] = item;
          return acc;
        }, {} as Record<string, Item>);

        set((state) => ({
          items: { ...state.items, ...itemsRecord },
        }));
      },

      setQuery: (query) => set({ query }),

      updateItem: (id, updates) => {
        set((state) => {
          const item = state.items[id];
          if (!item) return state;

          const { workspaceId, ...allowedUpdates } = updates as any;

          // ✅ 업데이트 시에도 stock과 minStock 분리 유지
          const updatedItem = { ...item, ...allowedUpdates };

          console.log("✅ 아이템 업데이트:", {
            itemId: id,
            oldStock: item.stock,
            newStock: updatedItem.stock,
            minStockAlert: updatedItem.minStock,
          });

          return {
            items: { ...state.items, [id]: updatedItem },
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

          const newStock = Math.max(0, item.stock + delta);

          console.log("✅ 재고 조정:", {
            itemId,
            itemName: item.name,
            oldStock: item.stock,
            delta,
            newStock,
            minStockAlert: item.minStock,
            isLowStock: newStock <= (item.minStock || 5),
          });

          return {
            items: {
              ...state.items,
              [itemId]: { ...item, stock: newStock },
            },
          };
        });
      },

      setStock: (itemId, stock) => {
        set((state) => {
          const item = state.items[itemId];
          if (!item) return state;

          const newStock = Math.max(0, stock);

          console.log("✅ 재고 설정:", {
            itemId,
            itemName: item.name,
            oldStock: item.stock,
            newStock,
            minStockAlert: item.minStock,
            isLowStock: newStock <= (item.minStock || 5),
          });

          return {
            items: {
              ...state.items,
              [itemId]: { ...item, stock: newStock },
            },
          };
        });
      },

      reset: () => {
        set({ items: {}, query: "" });
      },

      initializeWorkspace: (workspaceId) => {
        console.log("아이템 스토어 초기화 (워크스페이스):", workspaceId);
        // 워크스페이스 변경 시 쿼리만 초기화 (아이템은 유지)
        set((state) => ({ ...state, query: "" }));
      },
    }),
    {
      name: "inventory-items",
      storage: createJSONStorage(() => localStorage),
      version: 6, // ✅ 버전 업그레이드로 기존 잘못된 데이터 정리
      partialize: (state) => ({ items: state.items }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          console.log("✅ 아이템 스토어 rehydrate 완료");
          const currentWorkspaceId = getCurrentWorkspaceId();
          const itemCount = Object.keys(state.items).length;
          const workspaceItems = Object.values(state.items).filter(
            (item) => item.workspaceId === currentWorkspaceId
          );

          console.log(
            `총 아이템: ${itemCount}개, 현재 워크스페이스 아이템: ${workspaceItems.length}개`
          );

          // ✅ 각 아이템의 stock과 minStock 분리 확인
          workspaceItems.forEach((item) => {
            console.log(
              `아이템 "${item.name}": 실제재고=${item.stock}, 알림기준=${item.minStock}`
            );
          });
        }
      },
    }
  )
);

// 워크스페이스 변경 이벤트 리스너
window.addEventListener("workspace-changed", (event: any) => {
  console.log("아이템 스토어: 워크스페이스 변경 감지", event.detail);
  const newWorkspaceId = event.detail?.workspaceId;
  if (newWorkspaceId) {
    useItemsStore.getState().initializeWorkspace(newWorkspaceId);
  }
});

// 디버깅 도구 (개선)
if (typeof window !== "undefined" && import.meta.env.DEV) {
  (window as any).debugItemsStore = {
    getCurrentWorkspaceId,
    getItems: () => useItemsStore.getState().items,
    getWorkspaceItems: () => useItemsStore.getState().getWorkspaceItems(),
    checkStockVsMinStock: () => {
      const items = useItemsStore.getState().getWorkspaceItems();
      console.table(
        items.map((item) => ({
          name: item.name,
          actualStock: item.stock, // ✅ 실제 재고
          minStockAlert: item.minStock || 5, // ✅ 알림 기준
          isLowStock: item.stock <= (item.minStock || 5), // ✅ 부족 여부
        }))
      );
    },
    checkWorkspaceStorage: () => {
      const storage = localStorage.getItem("inventory-workspaces");
      console.log(
        "워크스페이스 스토리지:",
        storage ? JSON.parse(storage) : null
      );
    },
  };
}
