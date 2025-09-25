// src/hooks/useAdjustStock.ts
import { useState, useCallback } from "react";

export const useAdjustStock = () => {
  const [adjustFor, setAdjustFor] = useState<string | null>(null);

  const openAdjustModal = useCallback((itemId: string) => {
    setAdjustFor(itemId);
  }, []);

  const closeAdjustModal = useCallback(() => {
    setAdjustFor(null);
  }, []);

  return {
    adjustFor,
    openAdjustModal,
    closeAdjustModal,
    isAdjustModalOpen: adjustFor !== null,
  };
};
