// src/components/shared/SharedItemList.tsx

import React from "react";
import {
  AlertTriangle,
  Clock,
  CheckCircle,
  Minus,
  Hash,
  Barcode,
  Calendar,
  DollarSign,
} from "lucide-react";
import { Item } from "@/stores/itemsStore";
import { getExpiryStatus } from "@/utils/expiryUtils";

interface SharedItemListProps {
  items: Item[];
  permission: "view" | "use";
  onUseItem: (item: Item) => void;
}

export const SharedItemList: React.FC<SharedItemListProps> = React.memo(
  ({ items, permission, onUseItem }) => {
    return (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  상품정보
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  재고량
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  유통기한
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  가격
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  상태
                </th>
                {permission === "use" && (
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    작업
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {items.map((item) => {
                const expiryStatus = item.expiryDate
                  ? getExpiryStatus(item.expiryDate)
                  : null;
                const isLowStock = item.stock <= (item.minStock || 0);

                return (
                  <tr
                    key={item.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    {/* 상품정보 */}
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900 text-sm mb-1">
                          {item.name}
                        </div>
                        <div className="flex items-center space-x-3 text-xs text-gray-500">
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
                      </div>
                    </td>

                    {/* 재고량 */}
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`text-lg font-semibold ${
                            isLowStock ? "text-red-600" : "text-gray-900"
                          }`}
                        >
                          {item.stock}
                        </span>
                        <span className="text-sm text-gray-500">개</span>
                      </div>
                      {item.minStock && (
                        <div className="text-xs text-gray-400 mt-1">
                          최소: {item.minStock}개
                        </div>
                      )}
                    </td>

                    {/* 유통기한 */}
                    <td className="px-6 py-4">
                      {item.expiryDate ? (
                        <div>
                          <div
                            className={`text-sm flex items-center ${
                              expiryStatus?.status !== "safe"
                                ? expiryStatus?.color.includes("red")
                                  ? "text-red-600 font-medium"
                                  : "text-orange-600"
                                : "text-gray-900"
                            }`}
                          >
                            <Calendar className="w-4 h-4 mr-1" />
                            {new Date(item.expiryDate).toLocaleDateString(
                              "ko-KR"
                            )}
                          </div>
                          {expiryStatus && expiryStatus.status !== "safe" && (
                            <div className="text-xs text-gray-500 mt-1">
                              {expiryStatus.message}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>

                    {/* 가격 */}
                    <td className="px-6 py-4">
                      {item.defaultPrice ? (
                        <div className="flex items-center text-sm text-gray-900">
                          <DollarSign className="w-4 h-4 mr-1 text-gray-400" />
                          {item.defaultPrice.toLocaleString()}원
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>

                    {/* 상태 */}
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
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
                    </td>

                    {/* 작업 */}
                    {permission === "use" && (
                      <td className="px-6 py-4">
                        {item.stock > 0 ? (
                          <button
                            onClick={() => onUseItem(item)}
                            className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                          >
                            <Minus className="w-4 h-4 mr-1" />
                            사용
                          </button>
                        ) : (
                          <span className="text-sm text-gray-400">
                            재고없음
                          </span>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
);

SharedItemList.displayName = "SharedItemList";
