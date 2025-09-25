// src/components/dashboard/StatsCards.tsx
import React from "react";
import {
  Package,
  AlertTriangle,
  Activity,
  Package2,
  TrendingUp,
  CheckCircle,
} from "lucide-react";

interface StatsCardsProps {
  stats: {
    totalItems: number;
    lowStockItems: number;
    recentMovements: number;
    totalStock: number;
  };
}

export const StatsCards: React.FC<StatsCardsProps> = React.memo(({ stats }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* 전체 상품 */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 hover:border-gray-300 transition-colors group">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gray-50 rounded-lg text-gray-600 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium mb-1">
                전체 상품
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats.totalItems}
              </p>
            </div>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-500">등록된 상품 수</p>
        </div>
      </div>

      {/* 재고 부족 */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 hover:border-gray-300 transition-colors group">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div
              className={`p-2 rounded-lg transition-colors ${
                stats.lowStockItems > 0
                  ? "bg-red-50 text-red-600 group-hover:bg-red-100"
                  : "bg-green-50 text-green-600 group-hover:bg-green-100"
              }`}
            >
              {stats.lowStockItems > 0 ? (
                <AlertTriangle className="w-5 h-5" />
              ) : (
                <CheckCircle className="w-5 h-5" />
              )}
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium mb-1">
                재고 부족
              </p>
              <p
                className={`text-2xl font-semibold ${
                  stats.lowStockItems > 0 ? "text-red-600" : "text-green-600"
                }`}
              >
                {stats.lowStockItems}
              </p>
            </div>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            {stats.lowStockItems > 0 ? "주의 필요" : "모든 재고 안전"}
          </p>
        </div>
      </div>

      {/* 최근 움직임 */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 hover:border-gray-300 transition-colors group">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gray-50 rounded-lg text-gray-600 group-hover:bg-green-50 group-hover:text-green-600 transition-colors">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium mb-1">
                최근 움직임
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats.recentMovements}
              </p>
            </div>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-500">최근 7일</p>
        </div>
      </div>

      {/* 총 재고 */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 hover:border-gray-300 transition-colors group">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gray-50 rounded-lg text-gray-600 group-hover:bg-purple-50 group-hover:text-purple-600 transition-colors">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium mb-1">총 재고</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats.totalStock.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-500">전체 재고량</p>
        </div>
      </div>
    </div>
  );
});

StatsCards.displayName = "StatsCards";
