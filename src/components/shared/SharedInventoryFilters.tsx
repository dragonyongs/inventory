// src/components/shared/SharedInventoryFilters.tsx
import React, { useState, useCallback } from "react";
import { Search, X, Grid3X3, List } from "lucide-react";

interface SharedInventoryFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  viewMode: "grid" | "list";
  onViewModeChange: (mode: "grid" | "list") => void;
  itemCount: number;
}

export const SharedInventoryFilters: React.FC<SharedInventoryFiltersProps> =
  React.memo(
    ({
      searchQuery,
      onSearchChange,
      viewMode,
      onViewModeChange,
      itemCount,
    }) => {
      const [isSearchFocused, setIsSearchFocused] = useState(false);

      const handleClearSearch = useCallback(() => {
        onSearchChange("");
      }, [onSearchChange]);

      return (
        <div className="bg-slate-50 rounded-xl mb-4 p-4 space-y-4">
          {/* 검색바 */}
          <div
            className={`
            relative bg-white rounded-lg border-2 transition-colors
            ${isSearchFocused ? "border-blue-500" : "border-gray-200"}
          `}
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              placeholder="상품명, SKU, 바코드로 검색..."
              className="w-full py-3 pl-10 pr-10 bg-transparent border-0 outline-none text-sm font-medium text-gray-900 placeholder:text-gray-500"
            />
            {searchQuery && (
              <button
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* 뷰 모드 & 카운트 */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              {itemCount}개 상품
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => onViewModeChange("grid")}
                className={`p-2 rounded transition-colors ${
                  viewMode === "grid"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-800"
                }`}
                title="그리드 보기"
              >
                <Grid3X3 className="h-5 w-5" />
              </button>
              <button
                onClick={() => onViewModeChange("list")}
                className={`p-2 rounded transition-colors ${
                  viewMode === "list"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-800"
                }`}
                title="리스트 보기"
              >
                <List className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* 검색 결과 표시 */}
          {searchQuery && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-600">검색 중:</span>
              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md font-medium">
                "{searchQuery}"
              </span>
              <button
                onClick={handleClearSearch}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                지우기
              </button>
            </div>
          )}
        </div>
      );
    }
  );

SharedInventoryFilters.displayName = "SharedInventoryFilters";
