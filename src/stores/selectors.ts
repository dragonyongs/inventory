// src/stores/selectors.ts
import { useMemo } from "react";
import { shallow } from "zustand/shallow";
import { useItemsStore } from "./itemsStore";
import { useLotsStore } from "./lotsStore";
import { useMovementsStore } from "./movementsStore";
import type { Movement, Item } from "../types/domain";

const EMPTY_OBJ = {};

export type UIMovement = Movement;

const normalizeMovement = (m: any): UIMovement => ({
  id: m.id,
  type: m.type,
  itemId: m.itemId,
  lotId: m.lotId,
  qty: m.qty,
  reason: m.reason,
  actor: m.actor,
  createdAt: new Date(m.createdAt ?? 0).toISOString(),
});

export const useItemsMap = () =>
  useItemsStore((s) => s.items || EMPTY_OBJ, shallow) as Record<string, Item>;

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
  const lots = useLotsStore((s) => s.lots || EMPTY_OBJ, shallow);
  return useMemo(
    () =>
      Object.values(lots)
        .filter((l: any) => l.itemId === itemId)
        .reduce((sum: number, l: any) => sum + l.qty, 0),
    [lots, itemId]
  );
};

export const useExpiringSoonByItem = (itemId: string, days = 30) => {
  const lots = useLotsStore((s) => s.lots || EMPTY_OBJ, shallow);
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
  const byId = useMovementsStore((s) => s.byId || EMPTY_OBJ, shallow);
  return useMemo(() => {
    return Object.values(byId)
      .map(normalizeMovement)
      .sort(
        (a: UIMovement, b: UIMovement) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }, [byId]);
};
