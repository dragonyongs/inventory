// src/stores/selectors.ts

import { useMemo } from "react";
import { useItemsStore } from "./itemsStore";
import { useMovementsStore, type Movement } from "./movementsStore";
import { useLotsStore } from "./lotsStore";
import { useWorkspaceStore } from "./workspaceStore";

const EMPTY_OBJ = {} as const;

// 안정적인 셀렉터 상수 (모듈 스코프)
const selectItemsMap = (s: any) => s.items || EMPTY_OBJ;
const selectLotsMap = (s: any) => s.lots || EMPTY_OBJ;
const selectMovementsById = (s: any) => s.byId || EMPTY_OBJ;

export type UIMovement = Movement;

export const useItemsMap = () =>
  useItemsStore(selectItemsMap) as Record<string, any>;

export const useItemList = () => {
  const map = useItemsMap();
  return useMemo(() => {
    const values = Object.values(map);
    return Array.isArray(values) ? values : [];
  }, [map]);
};

export const useQuery = () => useItemsStore((s: any) => s.query);
export const useSetQuery = () => useItemsStore((s: any) => s.setQuery);

export const useVisibleItems = () => {
  const items = useItemList();
  const q = useQuery();
  return useMemo(() => {
    const query = q?.trim().toLowerCase();
    if (!query) return items;
    return items.filter((it: any) =>
      [it.name, it.sku, it.barcode].some((v) =>
        v?.toLowerCase().includes(query)
      )
    );
  }, [items, q]);
};

// 재고량 계산 - Items store 기반
export const useStockByItem = (itemId: string) => {
  const items = useItemsMap();
  return useMemo(() => {
    return items[itemId]?.stock || 0;
  }, [items, itemId]);
};

// 만료 임박 확인
export const useExpiringSoonByItem = (itemId: string, days = 30) => {
  const lots = useLotsStore(selectLotsMap);
  return useMemo(() => {
    return Object.values(lots).some((l: any) => {
      if (l.itemId !== itemId || !l.expiresAt) return false;
      const diff = new Date(l.expiresAt).getTime() - Date.now();
      return diff > 0 && diff < days * 86400000;
    });
  }, [lots, itemId, days]);
};

// 모든 아이템의 재고량
export const useAllStockByItems = () => {
  const items = useItemsMap();
  return useMemo(() => {
    if (!items || typeof items !== "object") return {};
    const stockMap: Record<string, number> = {};
    Object.values(items).forEach((item: any) => {
      if (item?.id) {
        stockMap[item.id] = item.stock || 0;
      }
    });
    return stockMap;
  }, [items]);
};

// 모든 만료 임박 아이템
export const useAllExpiringItems = (days = 30) => {
  const lots = useLotsStore(selectLotsMap);
  return useMemo(() => {
    if (!lots || typeof lots !== "object") return new Set<string>();
    const expiringSet = new Set<string>();
    const cutoffTime = Date.now() + days * 86400000;
    Object.values(lots).forEach((l: any) => {
      if (!l?.itemId || !l?.expiresAt) return;
      const expiresTime = new Date(l.expiresAt).getTime();
      if (expiresTime > Date.now() && expiresTime < cutoffTime) {
        expiringSet.add(l.itemId);
      }
    });
    return expiringSet;
  }, [lots, days]);
};

// ✅ 수정된 useMovementList - 타입 안전성 강화
export const useMovementList = (): Movement[] => {
  const byId = useMovementsStore(selectMovementsById);
  return useMemo(() => {
    const movements = Object.values(byId) as Movement[];
    return movements.sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [byId]);
};

// ✅ 대안: getVisible 사용 (쿼리 필터링 포함)
export const useFilteredMovementList = (): Movement[] => {
  return useMovementsStore((s) => {
    const result = s.getVisible?.();
    return Array.isArray(result) ? (result as Movement[]) : [];
  });
};

// ✅ 수정된 useSortedMovements - 이제 타입 에러 없음
export const useSortedMovements = (): Movement[] => {
  const movements = useMovementList();
  return useMemo(() => {
    // movements가 이미 Movement[] 타입이므로 추가 타입 캐스팅 불필요
    return [...movements].sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [movements]);
};

// 워크스페이스 관련 selectors
export const useCurrentWorkspace = () => {
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const currentWorkspaceId = useWorkspaceStore((s) => s.currentWorkspaceId);
  return useMemo(() => {
    return workspaces.find((ws) => ws.id === currentWorkspaceId) || null;
  }, [workspaces, currentWorkspaceId]);
};

export const useCurrentWorkspaceId = () => {
  return useWorkspaceStore((s) => s.currentWorkspaceId);
};

// 하위 호환성을 위한 별칭
export const useCurrentId = () => {
  return useWorkspaceStore((s) => s.currentWorkspaceId);
};
