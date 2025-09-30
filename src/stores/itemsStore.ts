// src/stores/itemsStore.ts (전체 파일)
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { useWorkspaceStore } from "./workspaceStore";
import { useCategoriesStore } from "./categoriesStore";
import { generateId } from "@/utils/generateId";

export interface Item {
  id: string;
  name: string;
  sku?: string;
  barcode?: string;
  stock: number;
  category?: string;
  minStock?: number;
  maxStock?: number;
  defaultPrice?: number;
  createdAt: string;
  workspaceId: string;
  expiryDate?: string;
  batchNumber?: string;
  receivedDate?: string;
  categoryId?: string;
  deletedAt?: string;
  deletedBy?: string;
  deletedReason?: string;
  isDeleted?: boolean;
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
  removeItem: (id: string, reason?: string) => void;
  hardDeleteItem: (id: string) => void;
  restoreItem: (id: string) => void;
  adjustStock: (itemId: string, delta: number) => void;
  setStock: (itemId: string, stock: number) => void;
  reset: () => void;
  getWorkspaceItems: () => Item[];
  initializeWorkspace: (workspaceId: string) => void;
  addMany: (
    items: Array<Omit<Item, "id" | "createdAt" | "workspaceId" | "stock">>
  ) => Item[];
}

type ItemsStore = ItemsState & ItemsActions;

// 워크스페이스 ID 가져오기 함수 (안정성 개선)
const getCurrentWorkspaceId = (): string | null => {
  try {
    const workspaceStorage = localStorage.getItem("inventory-workspaces");
    if (!workspaceStorage) {
      console.warn("워크스페이스 스토리지를 찾을 수 없습니다");
      return "default-workspace";
    }

    const parsed = JSON.parse(workspaceStorage);
    const currentWorkspaceId = parsed.state?.currentWorkspaceId;
    if (!currentWorkspaceId) {
      console.warn("현재 워크스페이스 ID가 없습니다");
      return "default-workspace";
    }

    return currentWorkspaceId;
  } catch (e) {
    console.error("워크스페이스 ID 가져오기 실패:", e);
    return "default-workspace";
  }
};

// ✅ 입고 시 maxStock 자동 업데이트 함수
export const updateMaxStock = (itemId: string, inQty: number) => {
  const store = useItemsStore.getState();
  const item = store.items[itemId];

  if (item) {
    const newMaxStock = (item.maxStock || 0) + inQty;
    store.updateItem(itemId, {
      maxStock: newMaxStock,
    });
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
        // ✅ 삭제되지 않은 아이템만 반환
        const workspaceItems = Object.values(allItems).filter(
          (item): item is Item =>
            item && item.workspaceId === currentWorkspaceId && !item.isDeleted
        );

        console.log(
          `워크스페이스 ${currentWorkspaceId}의 활성 아이템:`,
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
        const currentWorkspaceId =
          useWorkspaceStore.getState().currentWorkspaceId;
        const currentCategoryId =
          useCategoriesStore.getState().currentCategoryId;

        if (!currentWorkspaceId) {
          console.error(
            "현재 워크스페이스를 찾을 수 없습니다. 워크스페이스를 먼저 선택해주세요."
          );
          throw new Error(
            "워크스페이스를 선택해주세요. 사이드바에서 워크스페이스를 선택하거나 새로 생성하세요."
          );
        }

        const item: Item = {
          ...itemData,
          id: generateId("item"),
          workspaceId: currentWorkspaceId,
          categoryId: itemData.categoryId || currentCategoryId || undefined,
          stock: itemData.stock ?? 0,
          name: itemData.name,
          createdAt: new Date().toISOString(),
        };

        console.log("✅ 새 아이템 생성:", {
          itemId: item.id,
          workspaceId: currentWorkspaceId,
          name: item.name,
          actualStock: item.stock,
          minStockAlert: item.minStock,
        });

        set((state) => ({
          items: { ...state.items, [item.id]: item },
        }));
        return item;
      },

      addMany: (newItems) => {
        const currentWorkspace = useWorkspaceStore
          .getState()
          .getCurrentWorkspace();
        if (!currentWorkspace) {
          throw new Error("활성 워크스페이스가 없습니다");
        }

        const createdItems: Item[] = [];

        set((state) => {
          const updatedItems = { ...state.items };

          newItems.forEach((itemData) => {
            const id =
              globalThis.crypto?.randomUUID?.() ??
              `item-${Date.now()}-${Math.random()}`;
            const item: Item = {
              id,
              workspaceId: currentWorkspace.id,
              createdAt: new Date().toISOString(),
              stock: 0, // 초기값
              ...itemData,
            };

            updatedItems[id] = item;
            createdItems.push(item);
          });

          console.log(`✅ ${createdItems.length}개 아이템 대량 생성 완료`);
          return { items: updatedItems };
        });

        return createdItems;
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

          // workspaceId는 업데이트 대상이 아님. 타입 안전하게 제거
          const allowedUpdates = { ...updates };
          if ("workspaceId" in allowedUpdates) {
            delete (allowedUpdates as Partial<Item>).workspaceId;
          }
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

      // ✅ 수정: Soft Delete + 움직임 기록
      removeItem: (id, reason = "사용자 삭제") => {
        const state = get();
        const item = state.items[id];
        if (!item) {
          console.warn("삭제할 아이템을 찾을 수 없습니다:", id);
          return;
        }

        // ✅ Soft Delete: 실제 삭제 대신 삭제 표시
        const deletedItem = {
          ...item,
          isDeleted: true,
          deletedAt: new Date().toISOString(),
          deletedBy: "current-user",
          deletedReason: reason,
          stock: 0, // 재고를 0으로 설정하여 계산에서 제외
        };

        console.log("✅ 아이템 소프트 삭제:", {
          itemId: id,
          itemName: item.name,
          reason,
          deletedAt: deletedItem.deletedAt,
        });

        set({
          items: { ...state.items, [id]: deletedItem },
        });

        // ✅ 삭제 움직임 기록 (동적 import로 순환 의존성 방지)
        const movementId =
          globalThis.crypto?.randomUUID?.() ?? `movement_${Date.now()}`;

        // 움직임 스토어에 직접 접근하여 추가
        const movementsStorage = localStorage.getItem("inventory-movements");
        // movements는 실제로 localStorage에만 기록됨. 타입 명확화
        let movements: Record<string, any> = {};

        if (movementsStorage) {
          try {
            const parsed = JSON.parse(movementsStorage);
            movements = parsed.state?.byId || {};
          } catch (e) {
            console.error("움직임 스토리지 파싱 실패:", e);
          }
        }

        const deleteMovement = {
          id: movementId,
          type: "DELETE" as const,
          itemId: id,
          qty: 0,
          reason: `상품 삭제: ${reason}`,
          createdAt: new Date().toISOString(),
          // ✅ 아이템 스냅샷 저장
          itemSnapshot: {
            name: item.name,
            sku: item.sku,
            category: item.category,
          },
        };

        // movements 객체에 삭제 움직임 기록
        movements[movementId] = deleteMovement;

        // localStorage에 직접 저장
        try {
          const updatedMovementsStorage = {
            state: { byId: movements },
            version: 2,
          };
          localStorage.setItem(
            "inventory-movements",
            JSON.stringify(updatedMovementsStorage)
          );
          console.log("✅ 삭제 움직임 기록 완료:", movementId);
        } catch (e) {
          console.error("삭제 움직임 기록 실패:", e);
        }
      },

      // ✅ 새로 추가: 완전 삭제 (관리자용)
      hardDeleteItem: (id) => {
        set((state) => {
          const newItems = { ...state.items };
          delete newItems[id];
          console.log("❌ 아이템 완전 삭제:", id);
          return { items: newItems };
        });
      },

      // ✅ 새로 추가: 삭제 복구
      restoreItem: (id) => {
        set((state) => {
          const item = state.items[id];
          if (!item || !item.isDeleted) return state;

          const restoredItem = {
            ...item,
            isDeleted: false,
            deletedAt: undefined,
            deletedBy: undefined,
            deletedReason: undefined,
          };

          console.log("✅ 아이템 복구:", {
            itemId: id,
            itemName: item.name,
          });

          return {
            items: { ...state.items, [id]: restoredItem },
          };
        });
      },

      adjustStock: (itemId, delta) => {
        set((state) => {
          const item = state.items[itemId];
          if (!item) return state;

          const newStock = Math.max(0, item.stock + delta);

          // ✅ 입고(delta > 0)인 경우 maxStock 누적
          let newMaxStock = item.maxStock;
          if (delta > 0) {
            newMaxStock = (item.maxStock || 0) + delta;
            console.log(
              `✅ maxStock 업데이트: ${item.maxStock || 0} → ${newMaxStock}`
            );
          }

          console.log("✅ 재고 조정:", {
            itemId,
            itemName: item.name,
            oldStock: item.stock,
            delta,
            newStock,
            maxStock: newMaxStock,
            minStockAlert: item.minStock,
            isLowStock: newStock <= (item.minStock || 5),
          });

          return {
            items: {
              ...state.items,
              [itemId]: {
                ...item,
                stock: newStock,
                maxStock: newMaxStock, // ✅ maxStock 업데이트
              },
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
        set((state) => ({ ...state, query: "" }));
      },
    }),
    {
      name: "inventory-items",
      storage: createJSONStorage(() => localStorage),
      version: 8, // ✅ 버전 업그레이드
      partialize: (state) => ({ items: state.items }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          console.log("✅ 아이템 스토어 rehydrate 완료");
          const currentWorkspaceId = getCurrentWorkspaceId();
          const itemCount = Object.keys(state.items).length;
          const workspaceItems = Object.values(state.items).filter(
            (item) => item.workspaceId === currentWorkspaceId && !item.isDeleted
          );
          const deletedItems = Object.values(state.items).filter(
            (item) => item.workspaceId === currentWorkspaceId && item.isDeleted
          );

          // ✅ maxStock이 없는 기존 아이템들 초기화
          let migratedCount = 0;
          const updatedItems = { ...state.items };

          Object.values(state.items).forEach((item) => {
            if (!item.isDeleted && item.stock > 0 && !item.maxStock) {
              // 현재 재고를 초기 maxStock으로 설정
              updatedItems[item.id] = {
                ...item,
                maxStock: item.stock,
              };
              migratedCount++;
            }
          });

          if (migratedCount > 0) {
            console.log(`✅ ${migratedCount}개 아이템의 maxStock 초기화 완료`);
            // 상태 업데이트
            state.items = updatedItems;
          }

          console.log(
            `총 아이템: ${itemCount}개, 활성: ${workspaceItems.length}개, 삭제: ${deletedItems.length}개`
          );
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
