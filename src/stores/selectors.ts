// src/stores/selectors.ts
import { useShallow } from "zustand/react/shallow";
import { useItemsStore } from "./itemsStore";
export const useItemList = () =>
  useItemsStore(useShallow((s) => Object.values(s.items)));
