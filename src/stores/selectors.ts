// src/stores/selectors.ts
import { useMemo } from "react";
import { shallow } from "zustand/shallow";

import { useItemsStore } from "./itemsStore";
import { useLotsStore } from "./lotsStore";
import { useMovementsStore } from "./movementsStore";

// 참조 안정 상수
const EMPTY_ARR: any[] = [];
const EMPTY_OBJ: Record<string, any> = {};

// UI 표시용 Movement 타입
export type UIMovement = {
  id: string;
  itemId: string;
  lotId?: string;
  type: "IN" | "OUT" | "TRANSFER" | "ADJUST";
  qty: number;
  reason?: string;
  createdAt: string;
};

// 날짜 정규화
const normalizeDate = (d: any): string =>
  typeof d === "string" ? d : new Date(d ?? Date.now()).toISOString();

// Movement 정규화
const normalizeMovement = (m: any): UIMovement => ({
  id: m.id,
  itemId: m.item_id ?? m.itemId ?? "",
  lotId: m.lot_id ?? m.lotId,
  type: m.type,
  qty: m.qty,
  reason: m.reason,
  createdAt: normalizeDate(m.created_at ?? m.createdAt),
});

// 1) Items
export const useItemsMap = () =>
  useItemsStore((s: any) => s.items || EMPTY_OBJ, shallow);

export const useItemList = () => {
  const map = useItemsMap();
  return useMemo(() => Object.values(map), [map]);
};

export const useQuery = () => useItemsStore((s) => s.query);
export const useSetQuery = () => useItemsStore((s) => s.setQuery);

export const useVisibleItems = () => {
  const itemsRef = useItemsStore((s: any) => s.items || EMPTY_OBJ, shallow);
  const q = useItemsStore((s) => s.query);
  return useMemo(() => {
    const values = Object.values(itemsRef);
    const query = q?.trim()?.toLowerCase?.() ?? "";
    if (!query) return values;
    return values.filter((it: any) => {
      const name = it.name?.toLowerCase() ?? "";
      const sku = it.sku?.toLowerCase() ?? "";
      const barcode = it.barcode?.toLowerCase() ?? "";
      return (
        name.includes(query) || sku.includes(query) || barcode.includes(query)
      );
    });
  }, [itemsRef, q]);
};

// 2) Lots
export const useStockByItem = (itemId: string) => {
  const lotsRef = useLotsStore((s: any) => s.lots || EMPTY_OBJ, shallow);
  return useMemo(
    () =>
      Object.values(lotsRef)
        .filter((l: any) => (l.itemId ?? l.item_id) === itemId)
        .reduce((a: number, b: any) => a + (b.qty ?? 0), 0),
    [lotsRef, itemId]
  );
};

export const useExpiringSoonByItem = (itemId: string, days = 30) => {
  const lotsRef = useLotsStore((s: any) => s.lots || EMPTY_OBJ, shallow);
  return useMemo(() => {
    return Object.values(lotsRef).some((l: any) => {
      if ((l.itemId ?? l.item_id) !== itemId) return false;
      const exp = l.expiresAt ?? l.expires_at;
      if (!exp) return false;
      const diffDays = (new Date(exp).getTime() - Date.now()) / 86400000;
      return diffDays <= days;
    });
  }, [lotsRef, itemId, days]);
};

// 3) Movements — byId 맵을 배열로 안전 변환
export const useMovementList = () => {
  const byId = useMovementsStore((s: any) => s.byId || EMPTY_OBJ, shallow);
  return useMemo(() => {
    const list = Object.values(byId) as any[];
    return list
      .toSorted(
        (a, b) =>
          new Date(b.created_at ?? b.createdAt ?? 0).getTime() -
          new Date(a.created_at ?? a.createdAt ?? 0).getTime()
      )
      .map(normalizeMovement);
  }, [byId]);
};
