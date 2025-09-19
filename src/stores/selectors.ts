// src/stores/selectors.ts
import { useShallow } from "zustand/react/shallow";
import { useItemsStore } from "./itemsStore";
import { useLotsStore } from "./lotsStore";
import { useMovementsStore } from "./movementsStore";

export type UIMovement = {
  id: string;
  itemId: string;
  lotId?: string;
  type: "IN" | "OUT" | "TRANSFER" | "ADJUST";
  qty: number;
  reason?: string;
  createdAt: string;
};

// snake_case ↔ camelCase 정규화
function normalizeMovement(m: any): UIMovement {
  return {
    id: m.id,
    itemId: m.item_id ?? m.itemId,
    lotId: m.lot_id ?? m.lotId,
    type: m.type,
    qty: m.qty,
    reason: m.reason,
    createdAt: m.created_at ?? m.createdAt,
  };
}

export const useItemsMap = () =>
  useItemsStore(useShallow((s) => s.items ?? {}));

export const useItemList = () => {
  const map = useItemsMap();
  return Object.values(map ?? {});
};

// lots: snake/camel 혼용 대응
export const useStockByItem = (itemId: string) =>
  useLotsStore(
    useShallow((s) =>
      Object.values(s.lots ?? {})
        .filter((l: any) => (l.itemId ?? l.item_id) === itemId)
        .reduce((a: number, b: any) => a + (b.qty ?? 0), 0)
    )
  );

export const useExpiringSoonByItem = (itemId: string, days = 30) =>
  useLotsStore(
    useShallow((s) =>
      Object.values(s.lots ?? {}).some((l: any) => {
        if ((l.itemId ?? l.item_id) !== itemId) return false;
        const exp = l.expiresAt ?? l.expires_at;
        if (!exp) return false;
        const diffDays = (new Date(exp).getTime() - Date.now()) / 86400000;
        return diffDays <= days;
      })
    )
  );

// movements: s.movements → s.visible → s.byId 순서로 안전 접근
export const useMovementList = () =>
  useMovementsStore(
    useShallow((s: any) => {
      const arr = Array.isArray(s.movements)
        ? s.movements
        : Array.isArray(s.visible)
        ? s.visible
        : s.byId
        ? Object.values(s.byId)
        : [];
      return (arr ?? []).map(normalizeMovement);
    })
  );
