// src/components/shared/SharedItemCard.tsx

import React from "react";
import {
  Package,
  Minus,
  AlertTriangle,
  Clock,
  CheckCircle,
  Calendar,
  Hash,
  Barcode,
} from "lucide-react";
import { Item } from "@/stores/itemsStore";
import { getExpiryStatus } from "@/utils/expiryUtils";

interface SharedItemCardProps {
  items: Item[];
  permission: "view" | "use";
  onUseItem: (item: Item) => void;
}

export const SharedItemCard: React.FC<SharedItemCardProps> = React.memo(
  ({ items, permission, onUseItem }) => {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {items.map((item) => {
          const expiryStatus = item.expiryDate
            ? getExpiryStatus(item.expiryDate)
            : null;
          const isLowStock = item.stock <= (item.minStock || 0);

          return (
            <div
              key={item.id}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-all duration-200 hover:border-gray-300"
            >
              {/* 헤더 */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 text-base mb-1 line-clamp-2">
                    {item.name}
                  </h3>
                  {(item.sku || item.barcode) && (
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      {item.sku && (
                        <div className="flex items-center">
                          <Hash className="w-3 h-3 mr-1" />
                          {item.sku}
                        </div>
                      )}
                      {item.barcode && (
                        <div className="flex items-center">
                          <Barcode className="w-3 h-3 mr-1" />
                          {item.barcode}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <Package className="w-5 h-5 text-gray-400 flex-shrink-0 ml-2" />
              </div>

              {/* 재고 정보 */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">재고</span>
                  <span
                    className={`text-lg font-semibold ${
                      isLowStock ? "text-red-600" : "text-gray-900"
                    }`}
                  >
                    {item.stock}
                  </span>
                </div>

                {item.minStock && (
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        isLowStock ? "bg-red-500" : "bg-green-500"
                      }`}
                      style={{
                        width: `${Math.min(
                          100,
                          (item.stock / (item.minStock * 2)) * 100
                        )}%`,
                      }}
                    />
                  </div>
                )}
              </div>

              {/* 상태 및 날짜 정보 */}
              <div className="space-y-2 mb-4">
                {/* 유통기한 */}
                {item.expiryDate && (
                  <div className="flex items-center text-sm">
                    <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                    <span
                      className={`${
                        expiryStatus?.status !== "safe"
                          ? expiryStatus?.color.includes("red")
                            ? "text-red-600 font-medium"
                            : "text-orange-600"
                          : "text-gray-600"
                      }`}
                    >
                      {new Date(item.expiryDate).toLocaleDateString("ko-KR")}
                    </span>
                  </div>
                )}

                {/* 가격 */}
                {item.defaultPrice && (
                  <div className="text-sm text-gray-600">
                    {item.defaultPrice.toLocaleString()}원
                  </div>
                )}
              </div>

              {/* 상태 뱃지 */}
              <div className="flex flex-wrap gap-1 mb-4">
                {isLowStock && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    재고부족
                  </span>
                )}
                {expiryStatus && expiryStatus.status !== "safe" && (
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${expiryStatus.color}`}
                  >
                    <Clock className="w-3 h-3 mr-1" />
                    {expiryStatus.status === "expired"
                      ? "기한만료"
                      : expiryStatus.status === "critical"
                      ? "위험"
                      : expiryStatus.status === "warning"
                      ? "주의"
                      : "임박"}
                  </span>
                )}
                {!isLowStock &&
                  (!expiryStatus || expiryStatus.status === "safe") && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      정상
                    </span>
                  )}
              </div>

              {/* 사용 버튼 */}
              {permission === "use" && item.stock > 0 && (
                <button
                  onClick={() => onUseItem(item)}
                  className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Minus className="w-4 h-4 mr-2" />
                  사용하기
                </button>
              )}
            </div>
          );
        })}
      </div>
    );
  }
);

SharedItemCard.displayName = "SharedItemCard";
