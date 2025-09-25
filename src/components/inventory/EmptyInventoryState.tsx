// src/components/inventory/EmptyInventoryState.tsx
import React from "react";
import { Package } from "lucide-react";
import { AddItemButton } from "./AddItemButton";

interface EmptyInventoryStateProps {
  hasSearchQuery: boolean;
  searchQuery?: string;
}

export const EmptyInventoryState: React.FC<EmptyInventoryStateProps> =
  React.memo(({ hasSearchQuery, searchQuery }) => {
    if (hasSearchQuery) {
      return (
        <div className="rounded-lg border p-8 text-center text-sm text-gray-600">
          "{searchQuery}" 검색 결과가 없습니다. 다른 검색어로 시도해보시거나 새
          상품을 추가해보세요.
        </div>
      );
    }
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <Package className="h-10 w-10 text-gray-300" />
        <div className="text-base font-medium">
          새 품목을 추가하여 재고 관리를 시작해보세요
        </div>
        <div className="text-sm text-gray-500">
          체계적인 재고 관리로 효율성을 높여보세요
        </div>
        <div className="w-72 mt-4">
          <AddItemButton />
        </div>
      </div>
    );
  });

EmptyInventoryState.displayName = "EmptyInventoryState";
