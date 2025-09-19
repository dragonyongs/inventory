// src/stores/selectors.ts
import { useMemo } from "react";
import { shallow } from "zustand/shallow";
import { useItemsStore } from "./itemsStore";
import { useLotsStore } from "./lotsStore";
import { useMovementsStore } from "./movementsStore";
import type { Movement } from "../types/domain";

const EMPTY_OBJ = {} as const;

// 안정적인 셀렉터 상수 (모듈 스코프)
const selectItemsMap = (s: any) => s.items || EMPTY_OBJ;
const selectLotsMap = (s: any) => s.lots || EMPTY_OBJ;
const selectMovementsById = (s: any) => s.byId || EMPTY_OBJ;

export type UIMovement = Movement;

const normalizeMovement = (m: any): UIMovement => ({
  id: m.id,
  type: m.type,
  itemId: m.item_id || m.itemId,
  lotId: m.lotId,
  qty: m.qty,
  reason: m.reason,
  actor: m.actor || "system",
  createdAt: new Date(m.created_at || m.createdAt || 0).toISOString(),
});

export const useItemsMap = () =>
  useItemsStore(selectItemsMap, shallow) as Record<string, any>;

export const useItemList = () => {
  const map = useItemsMap();
  return useMemo(() => Object.values(map), [map]);
};

export const useQuery = () => useItemsStore((s) => s.query);
export const useSetQuery = () => useItemsStore((s) => s.setQuery);

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

export const useStockByItem = (itemId: string) => {
  const lots = useLotsStore(selectLotsMap, shallow);
  return useMemo(
    () =>
      Object.values(lots)
        .filter((l: any) => l.itemId === itemId)
        .reduce((sum: number, l: any) => sum + l.qty, 0),
    [lots, itemId]
  );
};

export const useExpiringSoonByItem = (itemId: string, days = 30) => {
  const lots = useLotsStore(selectLotsMap, shallow);
  return useMemo(
    () =>
      Object.values(lots).some((l: any) => {
        if (l.itemId !== itemId || !l.expiresAt) return false;
        const diff = new Date(l.expiresAt).getTime() - Date.now();
        return diff > 0 && diff < days * 86400000;
      }),
    [lots, itemId, days]
  );
};

export const useMovementList = () => {
  // 안정적인 셀렉터 + shallow로 스냅샷 참조 변동 억제
  const byId = useMovementsStore(selectMovementsById, shallow);
  return useMemo(() => {
    return Object.values(byId)
      .map(normalizeMovement)
      .sort(
        (a: UIMovement, b: UIMovement) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }, [byId]);
};
