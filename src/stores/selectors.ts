// src/stores/selectors.ts

import { useMemo } from "react";
import { useItemsStore } from "./itemsStore";
import { useMovementsStore } from "./movementsStore";
import { useWorkspaceStore } from "./workspaceStore";
import { useLotsStore } from "./lotsStore";

export const useItemList = () => {
  const items = useItemsStore((state) => state.items);
  const query = useItemsStore((state) => state.query);
  const currentWorkspaceId = useWorkspaceStore(
    (state) => state.currentWorkspaceId
  );

  return useMemo(() => {
    const allItems = Object.values(items);
    // 🔧 현재 워크스페이스의 아이템만 필터링
    const workspaceItems = currentWorkspaceId
      ? allItems.filter((item) => item.workspaceId === currentWorkspaceId)
      : [];

    console.log(
      `useItemList: 전체 ${allItems.length}개 중 워크스페이스 ${workspaceItems.length}개`
    );

    if (!query) return workspaceItems;

    const filtered = workspaceItems.filter(
      (item) =>
        item.name.toLowerCase().includes(query.toLowerCase()) ||
        item.sku?.toLowerCase().includes(query.toLowerCase()) ||
        item.barcode?.toLowerCase().includes(query.toLowerCase())
    );

    console.log(`검색 결과: ${filtered.length}개`);
    return filtered;
  }, [items, query, currentWorkspaceId]);
};

export const useMovementList = () => {
  // 🔧 getWorkspaceMovements 함수를 직접 호출하여 워크스페이스 필터링된 데이터 가져오기
  const getWorkspaceMovements = useMovementsStore(
    (state) => state.getWorkspaceMovements
  );
  const query = useMovementsStore((state) => state.query);
  const currentWorkspaceId = useWorkspaceStore(
    (state) => state.currentWorkspaceId
  );

  return useMemo(() => {
    if (!currentWorkspaceId) {
      console.log("useMovementList: 워크스페이스 ID 없음");
      return [];
    }

    // 🔧 직접 getWorkspaceMovements 호출
    const workspaceMovements = getWorkspaceMovements();

    console.log(
      `🔍 useMovementList: 워크스페이스 ${currentWorkspaceId}의 이동 ${workspaceMovements.length}개`
    );

    if (!query) return workspaceMovements;

    const filtered = workspaceMovements.filter(
      (movement) =>
        movement.itemId.toLowerCase().includes(query.toLowerCase()) ||
        movement.type.toLowerCase().includes(query.toLowerCase()) ||
        movement.note?.toLowerCase().includes(query.toLowerCase()) ||
        movement.reason?.toLowerCase().includes(query.toLowerCase())
    );

    console.log(`검색된 이동: ${filtered.length}개`);
    return filtered;
  }, [getWorkspaceMovements, query, currentWorkspaceId]);
};

// 🔧 누락된 함수들 추가
export const useVisibleItems = () => {
  return useItemList(); // useItemList와 동일한 기능
};

export const useStockByItem = (itemId: string) => {
  const items = useItemsStore((state) => state.items);

  return useMemo(() => {
    const item = items[itemId];
    return item?.stock || 0;
  }, [items, itemId]);
};

export const useExpiringSoonByItem = (itemId: string, days: number = 30) => {
  const lots = useLotsStore((state) => state.lots);

  return useMemo(() => {
    const itemLots = Object.values(lots).filter((lot) => lot.itemId === itemId);
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() + days);

    const expiringSoon = itemLots.some((lot) => {
      if (!lot.expiresAt) return false;
      return new Date(lot.expiresAt) <= thresholdDate;
    });

    return expiringSoon;
  }, [lots, itemId, days]);
};

export const useSetQuery = () => {
  const setQuery = useItemsStore((state) => state.setQuery);
  return setQuery;
};

export const useQuery = () => {
  const query = useItemsStore((state) => state.query);
  return query;
};

// 🔧 Dashboard에서 사용하는 함수들 추가
export const useAllStockByItems = () => {
  const items = useItemList(); // 이미 워크스페이스 필터링됨

  return useMemo(() => {
    return items.reduce((acc, item) => {
      acc[item.id] = item.stock;
      return acc;
    }, {} as Record<string, number>);
  }, [items]);
};

export const useAllExpiringItems = (days: number = 7) => {
  const items = useItemList(); // 이미 워크스페이스 필터링됨
  const lots = useLotsStore((state) => state.lots);

  return useMemo(() => {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + days);

    const expiringItems = items.filter((item) => {
      const itemLots = Object.values(lots).filter(
        (lot) => lot.itemId === item.id && lot.workspaceId === item.workspaceId
      );

      return itemLots.some((lot) => {
        if (!lot.expiresAt) return false;
        return new Date(lot.expiresAt) <= targetDate;
      });
    });

    // 🔧 Set으로 변환하여 .has() 메소드 사용 가능하게 수정
    return new Set(expiringItems.map((item) => item.id));
  }, [items, lots, days]);
};

export const useItemStats = () => {
  const items = useItemList(); // 이미 워크스페이스 필터링됨

  return useMemo(() => {
    const totalItems = items.length;
    const lowStockItems = items.filter((item) => {
      const minStock = item.minStock || 0;
      return item.stock <= minStock;
    });
    const outOfStockItems = items.filter((item) => item.stock === 0);
    const totalValue = items.reduce((sum, item) => {
      const price = item.defaultPrice || 0;
      return sum + price * item.stock;
    }, 0);

    console.log(
      `아이템 통계: 총 ${totalItems}개, 부족 ${lowStockItems.length}개, 품절 ${outOfStockItems.length}개`
    );

    return {
      totalItems,
      lowStockItems: lowStockItems.length,
      outOfStockItems: outOfStockItems.length,
      totalValue,
    };
  }, [items]);
};

export const useMovementStats = () => {
  const movements = useMovementList(); // 이미 워크스페이스 필터링됨

  return useMemo(() => {
    const today = new Date().toDateString();
    const todayMovements = movements.filter(
      (movement) => new Date(movement.createdAt).toDateString() === today
    );

    const recentMovements = movements
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, 10);

    console.log(
      `이동 통계: 총 ${movements.length}개, 오늘 ${todayMovements.length}개`
    );

    return {
      totalMovements: movements.length,
      todayMovements: todayMovements.length,
      recentMovements,
    };
  }, [movements]);
};

export const useLowStockItems = () => {
  const items = useItemList(); // 이미 워크스페이스 필터링됨

  return useMemo(() => {
    return items
      .filter((item) => {
        const minStock = item.minStock || 0;
        return item.stock <= minStock;
      })
      .sort((a, b) => a.stock - b.stock);
  }, [items]);
};

export const useExpiringItems = (days: number = 30) => {
  const items = useItemList(); // 이미 워크스페이스 필터링됨
  const lots = useLotsStore((state) => state.lots);

  return useMemo(() => {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + days);

    return items.filter((item) => {
      const itemLots = Object.values(lots).filter(
        (lot) => lot.itemId === item.id && lot.workspaceId === item.workspaceId
      );

      return itemLots.some((lot) => {
        if (!lot.expiresAt) return false;
        return new Date(lot.expiresAt) <= targetDate;
      });
    });
  }, [items, lots, days]);
};
