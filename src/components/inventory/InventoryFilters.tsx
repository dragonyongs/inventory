import React, { useState, useMemo, useCallback } from "react";
import {
  Search,
  Filter,
  X,
  ChevronDown,
  TrendingDown,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Package,
} from "lucide-react";

interface InventoryFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  // 추가 필터 Props
  statusFilter?: string;
  onStatusFilterChange?: (status: string) => void;
  categoryFilter?: string;
  onCategoryFilterChange?: (category: string) => void;
  stockFilter?: string;
  onStockFilterChange?: (stock: string) => void;
  expiryFilter?: string;
  onExpiryFilterChange?: (expiry: string) => void;
  showFilters?: boolean;
  onToggleFilters?: () => void;
  activeFiltersCount?: number;
}

export const InventoryFilters: React.FC<InventoryFiltersProps> = React.memo(
  ({
    searchQuery,
    onSearchChange,
    statusFilter = "",
    onStatusFilterChange,
    // categoryFilter = "",
    onCategoryFilterChange,
    stockFilter = "",
    onStockFilterChange,
    expiryFilter = "",
    onExpiryFilterChange,
    showFilters = false,
    onToggleFilters,
    activeFiltersCount = 0,
  }) => {
    const [isSearchFocused, setIsSearchFocused] = useState(false);

    const statusOptions = useMemo(
      () => [
        { value: "", label: "모든 상태", icon: Package, count: 0 },
        { value: "normal", label: "정상", icon: CheckCircle2, count: 0 },
        { value: "lowStock", label: "재고부족", icon: TrendingDown, count: 0 },
        { value: "expiring", label: "유통기한 임박", icon: Clock, count: 0 },
        { value: "expired", label: "기한만료", icon: AlertTriangle, count: 0 },
      ],
      []
    );

    const stockOptions = useMemo(
      () => [
        { value: "", label: "모든 재고" },
        { value: "high", label: "충분 (50개 이상)" },
        { value: "medium", label: "보통 (10-49개)" },
        { value: "low", label: "부족 (10개 미만)" },
        { value: "empty", label: "품절 (0개)" },
      ],
      []
    );

    const expiryOptions = useMemo(
      () => [
        { value: "", label: "모든 유통기한" },
        { value: "safe", label: "안전 (30일 이상)" },
        { value: "warning", label: "주의 (7-29일)" },
        { value: "critical", label: "위험 (3-6일)" },
        { value: "expired", label: "만료" },
      ],
      []
    );

    const handleClearSearch = useCallback(() => {
      onSearchChange("");
    }, [onSearchChange]);

    const handleClearFilters = useCallback(() => {
      onStatusFilterChange?.("");
      onCategoryFilterChange?.("");
      onStockFilterChange?.("");
      onExpiryFilterChange?.("");
    }, [
      onStatusFilterChange,
      onCategoryFilterChange,
      onStockFilterChange,
      onExpiryFilterChange,
    ]);

    return (
      <div className="bg-white border-b border-gray-100 sticky top-0 z-40">
        {/* 검색바 섹션 */}
        <div className="px-4 lg:px-6 py-4">
          <div className="max-w-7xl mx-auto">
            {/* 모바일 & 태블릿 & 데스크탑 공통 검색바 */}
            <div className="flex items-center gap-3">
              {/* 검색 입력 필드 */}
              <div className="flex-1 relative">
                <div
                  className={`
                    relative flex items-center
                    ${
                      isSearchFocused
                        ? "ring-2 ring-blue-500 shadow-lg"
                        : "shadow-sm hover:shadow-md"
                    }
                    transition-all duration-200
                    bg-gray-50 hover:bg-white
                    border border-gray-200 rounded-xl
                  `}
                >
                  <div className="absolute left-3 flex items-center pointer-events-none">
                    <Search
                      className={`w-4 h-4 transition-colors ${
                        isSearchFocused ? "text-blue-500" : "text-gray-400"
                      }`}
                    />
                  </div>

                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    onFocus={() => setIsSearchFocused(true)}
                    onBlur={() => setIsSearchFocused(false)}
                    placeholder="상품명, SKU, 바코드로 검색..."
                    className={`
                      w-full py-3 pl-10 pr-10
                      bg-transparent border-0 outline-none
                      text-sm font-medium text-gray-900
                      placeholder:text-gray-500
                      ${isSearchFocused ? "placeholder:text-gray-400" : ""}
                    `}
                  />

                  {searchQuery && (
                    <button
                      onClick={handleClearSearch}
                      className="absolute right-3 p-1 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <X className="w-3 h-3 text-gray-400 hover:text-gray-600" />
                    </button>
                  )}
                </div>

                {/* 검색 제안/최근 검색 (포커스시 표시) */}
                {isSearchFocused && searchQuery.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-50">
                    <div className="p-3 border-b border-gray-100">
                      <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                        검색 제안
                      </p>
                    </div>
                    <div className="py-2">
                      <button className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                        <Search className="w-3 h-3 text-gray-400" />
                        <span>"{searchQuery}" 포함 상품</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* 필터 토글 버튼 */}
              <button
                onClick={onToggleFilters}
                className={`
                  flex items-center gap-2 px-4 py-3 rounded-xl font-medium text-sm
                  transition-all duration-200
                  ${
                    showFilters
                      ? "bg-blue-50 text-blue-700 border border-blue-200"
                      : "bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100"
                  }
                `}
              >
                <Filter className="w-4 h-4" />
                <span className="hidden sm:inline">필터</span>
                {activeFiltersCount > 0 && (
                  <span className="bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {activeFiltersCount}
                  </span>
                )}
                <ChevronDown
                  className={`w-3 h-3 transition-transform ${
                    showFilters ? "rotate-180" : ""
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* 필터 패널 (확장시 표시) */}
        {showFilters && (
          <div className="border-t border-gray-100 bg-gray-50/50">
            <div className="px-4 lg:px-6 py-4">
              <div className="max-w-7xl mx-auto">
                {/* 모바일: 스택형 레이아웃 */}
                <div className="block lg:hidden space-y-4">
                  {/* 상태 필터 */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      상태별 필터
                    </label>
                    <select
                      value={statusFilter}
                      onChange={(e) => onStatusFilterChange?.(e.target.value)}
                      className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {statusOptions.map((option) => {
                        return (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {/* 재고량 필터 */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      재고량별 필터
                    </label>
                    <select
                      value={stockFilter}
                      onChange={(e) => onStockFilterChange?.(e.target.value)}
                      className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {stockOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 유통기한 필터 */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      유통기한별 필터
                    </label>
                    <select
                      value={expiryFilter}
                      onChange={(e) => onExpiryFilterChange?.(e.target.value)}
                      className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {expiryOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 데스크탑: 가로형 레이아웃 */}
                <div className="hidden lg:flex items-center gap-6">
                  {/* 상태 필터 */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-700 whitespace-nowrap">
                      상태:
                    </span>
                    <select
                      value={statusFilter}
                      onChange={(e) => onStatusFilterChange?.(e.target.value)}
                      className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[140px]"
                    >
                      {statusOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 재고량 필터 */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-700 whitespace-nowrap">
                      재고량:
                    </span>
                    <select
                      value={stockFilter}
                      onChange={(e) => onStockFilterChange?.(e.target.value)}
                      className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[160px]"
                    >
                      {stockOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 유통기한 필터 */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-700 whitespace-nowrap">
                      유통기한:
                    </span>
                    <select
                      value={expiryFilter}
                      onChange={(e) => onExpiryFilterChange?.(e.target.value)}
                      className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[160px]"
                    >
                      {expiryOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 필터 초기화 */}
                  {activeFiltersCount > 0 && (
                    <button
                      onClick={handleClearFilters}
                      className="ml-4 text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors"
                    >
                      필터 초기화
                    </button>
                  )}
                </div>

                {/* 모바일 필터 액션 */}
                <div className="block lg:hidden mt-4 flex justify-between items-center">
                  {activeFiltersCount > 0 && (
                    <span className="text-sm text-gray-600">
                      {activeFiltersCount}개 필터 적용됨
                    </span>
                  )}
                  <div className="flex gap-2">
                    {activeFiltersCount > 0 && (
                      <button
                        onClick={handleClearFilters}
                        className="text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors"
                      >
                        초기화
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 활성 필터 태그 (검색어나 필터가 있을 때만 표시) */}
        {(searchQuery || activeFiltersCount > 0) && (
          <div className="px-4 lg:px-6 py-3 bg-blue-50/50 border-t border-blue-100">
            <div className="max-w-7xl mx-auto flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
                적용된 필터:
              </span>

              {searchQuery && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                  <Search className="w-3 h-3" />
                  <span>검색: "{searchQuery}"</span>
                  <button
                    onClick={handleClearSearch}
                    className="hover:bg-blue-200 rounded-full p-0.5 transition-colors"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </div>
              )}

              {statusFilter && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                  <span>
                    상태:{" "}
                    {statusOptions.find((o) => o.value === statusFilter)?.label}
                  </span>
                  <button
                    onClick={() => onStatusFilterChange?.("")}
                    className="hover:bg-green-200 rounded-full p-0.5 transition-colors"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </div>
              )}

              {stockFilter && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                  <span>
                    재고:{" "}
                    {stockOptions.find((o) => o.value === stockFilter)?.label}
                  </span>
                  <button
                    onClick={() => onStockFilterChange?.("")}
                    className="hover:bg-purple-200 rounded-full p-0.5 transition-colors"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </div>
              )}

              {expiryFilter && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium">
                  <span>
                    유통기한:{" "}
                    {expiryOptions.find((o) => o.value === expiryFilter)?.label}
                  </span>
                  <button
                    onClick={() => onExpiryFilterChange?.("")}
                    className="hover:bg-orange-200 rounded-full p-0.5 transition-colors"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }
);

InventoryFilters.displayName = "InventoryFilters";
