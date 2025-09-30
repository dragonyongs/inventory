// src/components/movements/EmptyMovementsState.tsx

import React, { memo } from "react";
import { Activity } from "lucide-react";

interface EmptyMovementsStateProps {
  hasFilters: boolean;
  searchQuery: string;
}

export const EmptyMovementsState = memo<EmptyMovementsStateProps>(
  ({ hasFilters, searchQuery }) => {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <Activity className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {hasFilters || searchQuery
            ? "검색 결과가 없습니다"
            : "아직 이동 내역이 없습니다"}
        </h3>
        <p className="text-gray-500 mb-4">
          {hasFilters || searchQuery
            ? "다른 검색어나 필터를 시도해보세요"
            : "상품을 추가하고 입출고를 기록해보세요"}
        </p>
      </div>
    );
  }
);

EmptyMovementsState.displayName = "EmptyMovementsState";
