// src/stores/selectors.ts
import { useShallow } from "zustand/react/shallow";
import { useItemsStore } from "./itemsStore";
import { useLotsStore } from "./lotsStore";
import { useMovementsStore } from "./movementsStore";

export const useItemList = () =>
  useItemsStore(useShallow((s) => Object.values(s.items)));

export const useLotsByItem = (itemId: string) =>
  useLotsStore(
    useShallow((s) =>
      Object.values(s.lots)
        .filter((l) => l.itemId === itemId)
        .sort(
          (a, b) =>
            new Date(a.expiresAt ?? "9999").getTime() -
            new Date(b.expiresAt ?? "9999").getTime()
        )
    )
  );

export const useMovementList = () =>
  useMovementsStore(useShallow((s) => s.movements));
