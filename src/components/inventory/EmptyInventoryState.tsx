// src/components/inventory/EmptyInventoryState.tsx
import React from "react";
import { Package } from "lucide-react";

interface EmptyInventoryStateProps {
  hasSearchQuery: boolean;
  searchQuery?: string;
}

export const EmptyInventoryState: React.FC<EmptyInventoryStateProps> =
  React.memo(({ hasSearchQuery, searchQuery }) => {
    if (hasSearchQuery) {
      return (
        <div className="rounded-lg p-8 text-center text-sm text-gray-600 space-y-2">
          <p className="text-xl">"{searchQuery}" 검색 결과가 없습니다.</p>
          <p>다른 검색어로 시도해보시거나 새 상품을 추가해보세요.</p>
        </div>
      );
    }
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          등록된 품목이 없습니다
        </h3>
        <p className="text-gray-500 mb-4">
          새 품목을 추가하여 재고 관리를 시작해보세요.
        </p>
        <p className="text-xs text-gray-400">
          💡 체계적인 재고 관리로 효율성을 높여보세요
        </p>
      </div>
    );
  });

EmptyInventoryState.displayName = "EmptyInventoryState";
