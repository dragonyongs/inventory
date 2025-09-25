// src/components/dashboard/StatsCards.tsx
import React from "react";
import {
  Package,
  AlertTriangle,
  Activity,
  Package2,
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
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-shadow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">전체 상품</p>
            <p className="text-3xl font-bold text-gray-900">
              {stats.totalItems}
            </p>
            <p className="text-xs text-gray-600 mt-2">등록된 상품 수</p>
          </div>
          <div className="p-3 bg-blue-100 rounded-xl">
            <Package className="w-6 h-6 text-blue-600" />
          </div>
        </div>
      </div>

      {/* 재고 부족 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-shadow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">재고 부족</p>
            <p
              className={`text-3xl font-bold ${
                stats.lowStockItems > 0 ? "text-red-600" : "text-green-600"
              }`}
            >
              {stats.lowStockItems}
            </p>
            <p className="text-xs text-gray-600 mt-2">
              {stats.lowStockItems > 0 ? "주의 필요" : "모든 재고 안전"}
            </p>
          </div>
          <div
            className={`p-3 rounded-xl ${
              stats.lowStockItems > 0 ? "bg-red-100" : "bg-green-100"
            }`}
          >
            {stats.lowStockItems > 0 ? (
              <AlertTriangle className="w-6 h-6 text-red-600" />
            ) : (
              <CheckCircle className="w-6 h-6 text-green-600" />
            )}
          </div>
        </div>
      </div>

      {/* 최근 움직임 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-shadow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">
              최근 움직임
            </p>
            <p className="text-3xl font-bold text-green-600">
              {stats.recentMovements}
            </p>
            <p className="text-xs text-gray-600 mt-2">최근 7일</p>
          </div>
          <div className="p-3 bg-green-100 rounded-xl">
            <Activity className="w-6 h-6 text-green-600" />
          </div>
        </div>
      </div>

      {/* 총 재고 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-shadow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">총 재고</p>
            <p className="text-3xl font-bold text-purple-600">
              {stats.totalStock.toLocaleString()}
            </p>
            <p className="text-xs text-gray-600 mt-2">전체 재고량</p>
          </div>
          <div className="p-3 bg-purple-100 rounded-xl">
            <Package2 className="w-6 h-6 text-purple-600" />
          </div>
        </div>
      </div>
    </div>
  );
});

StatsCards.displayName = "StatsCards";
