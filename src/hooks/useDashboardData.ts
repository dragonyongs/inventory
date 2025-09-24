// src/hooks/useDashboardData.ts
import { useMemo } from "react";

export type ExpiringInput =
  | Set<string>
  | Array<{ id: string } | string>
  | undefined
  | null;

export function toExpiringIds(input: ExpiringInput): string[] {
  if (!input) return [];
  if (input instanceof Set) return Array.from(input);
  if (Array.isArray(input)) {
    return input.map((item) => (typeof item === "string" ? item : item.id));
  }
  console.warn("expiringItemsSet: unexpected type", typeof input);
  return [];
}

export interface DashboardStats {
  totalItems: number;
  lowStockCount: number;
  recentMovements: number;
  totalLots: number;
  expiringIds: string[];
}

type Source = {
  items?: Array<{ id: string; qty?: number; minQty?: number }> | null;
  movements?: Array<unknown> | null;
  lots?: Array<unknown> | null;
  expiring?: ExpiringInput;
};

export function useDashboardData(src: Source): DashboardStats {
  return useMemo(() => {
    const items = Array.isArray(src.items) ? src.items : [];
    const movements = Array.isArray(src.movements) ? src.movements : [];
    const lots = Array.isArray(src.lots) ? src.lots : [];

    const totalItems = items.length;
    const lowStockCount = items.filter(
      (i) => (i.qty ?? 0) <= (i.minQty ?? -1)
    ).length;
    const recentMovements = movements.length;
    const totalLots = lots.length;
    const expiringIds = toExpiringIds(src.expiring);

    return {
      totalItems,
      lowStockCount,
      recentMovements,
      totalLots,
      expiringIds,
    };
  }, [src.items, src.movements, src.lots, src.expiring]);
}
