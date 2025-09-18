// src/stores/selectors.ts
import { useShallow } from "zustand/react/shallow";
import { useItemsStore } from "./itemsStore";
import { useLotsStore } from "./lotsStore";
import { useMovementsStore } from "./movementsStore";

export const useItemList = () =>
  useItemsStore(useShallow((s) => Object.values(s.items)));

export const useItemsMap = () => useItemsStore(useShallow((s) => s.items));

export const useStockByItem = (itemId: string) =>
  useLotsStore(
    useShallow((s) =>
      Object.values(s.lots)
        .filter((l) => l.itemId === itemId)
        .reduce((a, b) => a + b.qty, 0)
    )
  );

export const useExpiringSoonByItem = (itemId: string, days = 30) =>
  useLotsStore(
    useShallow((s) =>
      Object.values(s.lots).some(
        (l) =>
          l.itemId === itemId &&
          l.expiresAt &&
          (new Date(l.expiresAt).getTime() - Date.now()) / 86400000 <= days
      )
    )
  );

export const useMovementList = () =>
  useMovementsStore(useShallow((s) => s.movements));
