// src/stores/selectors.ts

import { useMemo } from "react";
import { useItemsStore } from "./itemsStore";
import { useLotsStore } from "./lotsStore";
import { useMovementsStore, type Movement } from "./movementsStore";
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
  return useMemo(() => Object.values(map), [map]);
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
    const stockMap: Record<string, number> = {};
    Object.values(items).forEach((item: any) => {
      stockMap[item.id] = item.stock || 0;
    });
    return stockMap;
  }, [items]);
};

// 모든 만료 임박 아이템
export const useAllExpiringItems = (days = 30) => {
  const lots = useLotsStore(selectLotsMap);
  return useMemo(() => {
    const expiringSet = new Set<string>();
    const cutoffTime = Date.now() + days * 86400000;

    Object.values(lots).forEach((l: any) => {
      if (!l.itemId || !l.expiresAt) return;
      const expiresTime = new Date(l.expiresAt).getTime();
      if (expiresTime > Date.now() && expiresTime < cutoffTime) {
        expiringSet.add(l.itemId);
      }
    });

    return expiringSet;
  }, [lots, days]);
};

export const useMovementList = () => {
  const byId = useMovementsStore(selectMovementsById);
  return useMemo(() => {
    return Object.values(byId).sort(
      (a: Movement, b: Movement) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [byId]);
};
