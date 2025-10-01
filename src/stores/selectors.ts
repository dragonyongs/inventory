// src/stores/selectors.ts
import { useMemo } from "react";
import { useItemsStore } from "./itemsStore";
import { useMovementsStore } from "./movementsStore";
import { useWorkspaceStore } from "./workspaceStore";
import { useLotsStore } from "./lotsStore";
import { useCategoriesStore } from "./categoriesStore";

// ✅ 아이템 목록 (삭제되지 않은 것만)
export const useItemList = () => {
  const items = useItemsStore((state) => state.items);
  const query = useItemsStore((state) => state.query);
  const currentWorkspaceId = useWorkspaceStore(
    (state) => state.currentWorkspaceId
  );

  return useMemo(() => {
    if (!currentWorkspaceId) return [];

    const allItems = Object.values(items);
    const workspaceItems = allItems.filter(
      (item) =>
        item && item.workspaceId === currentWorkspaceId && !item.isDeleted
    );

    console.log("useItemList:", allItems.length, "->", workspaceItems.length);

    if (!query) return workspaceItems;

    const filtered = workspaceItems.filter(
      (item) =>
        item.name.toLowerCase().includes(query.toLowerCase()) ||
        item.sku?.toLowerCase().includes(query.toLowerCase()) ||
        item.barcode?.toLowerCase().includes(query.toLowerCase())
    );

    return filtered;
  }, [items, query, currentWorkspaceId]);
};

// 현재 useItemList는 이미 query 필터링 구현됨 [attached_file:2]
export const useFilteredMovements = () => {
  const movements = useMovementList();
  const query = useItemsStore((state) => state.query);

  return useMemo(() => {
    if (!query) return movements;
    const q = query.toLowerCase();
    return movements.filter(
      (movement) =>
        movement.itemName?.toLowerCase().includes(q) ||
        movement.itemSku?.toLowerCase().includes(q) ||
        movement.reason?.toLowerCase?.().includes(q) ||
        movement.type?.toLowerCase?.().includes(q)
    );
  }, [movements, query]);
};

// 향후 Lots, Reports 등에도 동일 패턴 적용 가능
export const useFilteredLots = () => {
  const lotsRecord = useLotsStore((s) => s.lots);
  const query = useItemsStore((s) => s.query);
  const allWorkspaceItems = useAllWorkspaceItems(); // 기존 훅 재사용
  const currentWorkspaceId = useWorkspaceStore(
    (state) => state.currentWorkspaceId
  );

  return useMemo(() => {
    if (!currentWorkspaceId) return [];

    // 1) Record를 배열로 변환 + 현재 워크스페이스 필터링
    const lotsArray = Object.values(lotsRecord).filter(
      (lot) => lot.workspaceId === currentWorkspaceId
    );

    // 2) 아이템 정보 조인 (itemName 추가)
    const itemsMap = new Map(allWorkspaceItems.map((item) => [item.id, item]));
    const enrichedLots = lotsArray.map((lot) => {
      const item = itemsMap.get(lot.itemId);
      return {
        ...lot,
        itemName: item?.name || "알 수 없는 상품",
        itemSku: item?.sku,
      };
    });

    // 3) 검색 필터링
    if (!query) return enrichedLots;

    const q = query.toLowerCase();
    return enrichedLots.filter(
      (lot) =>
        lot.batchNumber?.toLowerCase().includes(q) ||
        lot.itemName?.toLowerCase().includes(q) ||
        lot.itemSku?.toLowerCase().includes(q) ||
        lot.supplier?.toLowerCase().includes(q) ||
        lot.notes?.toLowerCase().includes(q)
    );
  }, [lotsRecord, query, allWorkspaceItems, currentWorkspaceId]);
};

export const useLotsList = () => {
  const lotsRecord = useLotsStore((s) => s.lots);
  const allWorkspaceItems = useAllWorkspaceItems();
  const currentWorkspaceId = useWorkspaceStore(
    (state) => state.currentWorkspaceId
  );

  return useMemo(() => {
    if (!currentWorkspaceId) return [];

    const lotsArray = Object.values(lotsRecord).filter(
      (lot) => lot.workspaceId === currentWorkspaceId
    );

    const itemsMap = new Map(allWorkspaceItems.map((item) => [item.id, item]));
    return lotsArray.map((lot) => {
      const item = itemsMap.get(lot.itemId);
      return {
        ...lot,
        itemName: item?.name || "알 수 없는 상품",
        itemSku: item?.sku,
      };
    });
  }, [lotsRecord, allWorkspaceItems, currentWorkspaceId]);
};

// ✅ 모든 워크스페이스 아이템 (삭제된 것 포함)
export const useAllWorkspaceItems = () => {
  const items = useItemsStore((state) => state.items);
  const currentWorkspaceId = useWorkspaceStore(
    (state) => state.currentWorkspaceId
  );

  return useMemo(() => {
    if (!currentWorkspaceId) return [];

    const allItems = Object.values(items);
    return allItems.filter(
      (item) => item && item.workspaceId === currentWorkspaceId
    );
  }, [items, currentWorkspaceId]);
};

// ✅ 움직임 목록 (수정된 버전)
export const useMovementList = () => {
  const byId = useMovementsStore((state) => state.byId);
  const allWorkspaceItems = useAllWorkspaceItems();

  return useMemo(() => {
    const movements = Object.values(byId).sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const itemsMap = new Map(allWorkspaceItems.map((item) => [item.id, item]));

    const enrichedMovements = movements.map((movement) => {
      const item = itemsMap.get(movement.itemId);

      return {
        ...movement,
        itemName:
          item?.name || movement.itemSnapshot?.name || "알 수 없는 상품",
        itemSku: item?.sku || movement.itemSnapshot?.sku,
        isItemDeleted: item?.isDeleted || false,
      };
    });

    const workspaceMovements = enrichedMovements.filter((movement) => {
      const item = itemsMap.get(movement.itemId);
      return !!item;
    });

    console.log(
      "useMovementList:",
      movements.length,
      "->",
      workspaceMovements.length
    );
    return workspaceMovements;
  }, [byId, allWorkspaceItems]);
};

// ✅ **핵심 수정**: 올바른 재고 계산 - itemsStore의 stock만 사용
export const useAllStockByItems = () => {
  const items = useItemList();

  return useMemo(() => {
    // console.log("useAllStockByItems 계산 시작");

    const stockMap: Record<string, number> = {};

    // ✅ 수정: itemsStore의 stock만 사용 (이미 움직임이 반영됨)
    items.forEach((item) => {
      stockMap[item.id] = item.stock || 0;
    });

    // console.log("useAllStockByItems 계산 완료:", Object.keys(stockMap).length);
    // console.log("stockMap:", stockMap);
    return stockMap;
  }, [items]);
};

// ✅ 개별 재고 조회
export const useStockByItem = (itemId: string) => {
  const stockByItems = useAllStockByItems();
  return stockByItems[itemId] || 0;
};

// ✅ 유통기한 임박 아이템 (개별)
export const useExpiringSoonByItem = (itemId: string, days = 30) => {
  const items = useItemList();

  return useMemo(() => {
    const item = items.find((i) => i.id === itemId);
    if (!item?.expiryDate) return false;

    const expiryDate = new Date(item.expiryDate);
    const now = new Date();
    const diffTime = expiryDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays <= days && diffDays >= 0;
  }, [items, itemId, days]);
};

// ✅ 유통기한 임박 아이템 (전체)
export const useAllExpiringItems = (days = 30) => {
  const items = useItemList();

  return useMemo(() => {
    const expiringItems = new Set<string>();
    const now = new Date();

    items.forEach((item) => {
      if (!item.expiryDate) return;

      const expiryDate = new Date(item.expiryDate);
      const diffTime = expiryDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays <= days && diffDays >= 0) {
        expiringItems.add(item.id);
      }
    });

    console.log("useAllExpiringItems 계산 완료:", expiringItems.size);
    return expiringItems;
  }, [items, days]);
};

// 기타 유틸 훅들
export const useSetQuery = () => {
  return useItemsStore((state) => state.setQuery);
};

export const useQuery = () => {
  return useItemsStore((state) => state.query);
};

// export const useVisibleItems = () => {
//   return useItemList();
// };

// 카테고리별 아이템 목록
export const useItemsByCategory = (categoryId?: string) => {
  const items = useItemsStore((state) => state.items);
  const query = useItemsStore((state) => state.query);
  const currentWorkspaceId = useWorkspaceStore(
    (state) => state.currentWorkspaceId
  );
  const currentCategoryId = useCategoriesStore(
    (state) => state.currentCategoryId
  );

  const targetCategoryId = categoryId || currentCategoryId;

  return useMemo(() => {
    if (!currentWorkspaceId) return [];

    const allItems = Object.values(items);
    let workspaceItems = allItems.filter(
      (item) =>
        item && item.workspaceId === currentWorkspaceId && !item.isDeleted
    );

    // 카테고리 필터링 (전체가 아닌 경우만)
    if (targetCategoryId) {
      const category =
        useCategoriesStore.getState().categories[targetCategoryId];
      if (category && !category.isDefault) {
        workspaceItems = workspaceItems.filter(
          (item) => item.categoryId === targetCategoryId
        );
      }
    }

    // 검색 필터링
    if (query) {
      workspaceItems = workspaceItems.filter(
        (item) =>
          item.name.toLowerCase().includes(query.toLowerCase()) ||
          item.sku?.toLowerCase().includes(query.toLowerCase()) ||
          item.barcode?.toLowerCase().includes(query.toLowerCase())
      );
    }

    return workspaceItems;
  }, [items, query, currentWorkspaceId, targetCategoryId]);
};

// 기존 useItemList를 useItemsByCategory로 교체
export const useVisibleItems = () => useItemsByCategory();
