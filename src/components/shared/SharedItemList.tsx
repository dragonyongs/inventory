// src/components/shared/SharedItemList.tsx

import React from "react";
import {
  Package,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Hash,
  Barcode,
  ShoppingCart,
  TrendingDown,
} from "lucide-react";
import { Item } from "@/stores/itemsStore";
import { getExpiryStatus } from "@/utils/expiryUtils";

interface SharedItemListProps {
  items: Item[];
  permission: "view" | "use";
  onUseItem: (item: Item) => void;
}

// 🔧 상태 정보를 계산하는 헬퍼 함수 (SharedItemCard와 동일)
const getStatusInfo = (item: Item, expiryStatus: any, isLowStock: boolean) => {
  if (item.stock === 0)
    return {
      type: "critical",
      label: "품절",
      color: "text-red-600",
      bgColor: "bg-red-50",
      borderColor: "border-red-100",
      badgeColor: "bg-red-100 text-red-700",
      icon: Package,
      severity: 5,
    };

  if (expiryStatus?.status === "expired")
    return {
      type: "critical",
      label: "만료",
      color: "text-red-600",
      bgColor: "bg-red-50",
      borderColor: "border-red-100",
      badgeColor: "bg-red-100 text-red-700",
      icon: AlertTriangle,
      severity: 4,
    };

  if (isLowStock)
    return {
      type: "warning",
      label: "부족",
      color: "text-amber-600",
      bgColor: "bg-amber-50",
      borderColor: "border-amber-100",
      badgeColor: "bg-amber-100 text-amber-700",
      icon: TrendingDown,
      severity: 3,
    };

  if (expiryStatus?.status === "critical")
    return {
      type: "warning",
      label: "주의",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-100",
      badgeColor: "bg-orange-100 text-orange-700",
      icon: Clock,
      severity: 3,
    };

  return {
    type: "normal",
    label: "정상",
    color: "text-slate-600",
    bgColor: "bg-white",
    borderColor: "border-slate-200",
    badgeColor: "bg-slate-100 text-slate-600",
    icon: CheckCircle2,
    severity: 0,
  };
};

export const SharedItemList: React.FC<SharedItemListProps> = React.memo(
  ({ items, permission, onUseItem }) => {
    if (items.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 px-4">
          <Package className="w-12 h-12 text-slate-400 mb-4" />
          <p className="text-slate-500 text-center">표시할 아이템이 없습니다</p>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        {/* 🎯 모던한 테이블 헤더 */}
        <div className="bg-slate-50 border-b border-slate-200">
          <div className="grid grid-cols-12 gap-4 px-6 py-4 text-xs font-semibold text-slate-700 uppercase tracking-wider">
            <div className="col-span-4">상품 정보</div>
            <div className="col-span-2 text-center">재고량</div>
            <div className="col-span-2 text-center">유통기한</div>
            <div className="col-span-2 text-center">가격</div>
            <div className="col-span-1 text-center">상태</div>
            {permission === "use" && (
              <div className="col-span-1 text-center">작업</div>
            )}
          </div>
        </div>

        {/* 🎯 테이블 바디 */}
        <div className="divide-y divide-slate-100">
          {items.map((item, index) => {
            const expiryStatus = item.expiryDate
              ? getExpiryStatus(item.expiryDate)
              : null;
            const isLowStock = item.stock <= (item.minStock || 0);
            const statusInfo = getStatusInfo(item, expiryStatus, isLowStock);
            const StatusIcon = statusInfo.icon;

            return (
              <div
                key={item.id}
                className={`
                  grid grid-cols-12 gap-4 px-6 py-4 
                  hover:bg-slate-50 transition-colors duration-150
                  ${statusInfo.severity > 0 ? statusInfo.bgColor : ""}
                  ${index % 2 === 1 ? "bg-slate-25" : ""}
                `}
              >
                {/* 🎯 상품 정보 - 4열 */}
                <div className="col-span-4 flex items-center space-x-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {item.name}
                    </p>

                    {/* 식별 코드 */}
                    <div className="flex items-center space-x-2 mt-1">
                      {item.sku && (
                        <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                          <Hash className="w-3 h-3" />
                          {item.sku}
                        </span>
                      )}
                      {item.barcode && (
                        <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                          <Barcode className="w-3 h-3" />
                          {item.barcode}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 🎯 재고량 - 2열 */}
                <div className="col-span-2 flex flex-col items-center justify-center">
                  <div className="text-lg font-bold text-slate-900">
                    {item.stock.toLocaleString()}
                  </div>
                  <div className="text-xs text-slate-500">
                    {item.minStock && item.minStock > 0
                      ? `최소: ${item.minStock}개`
                      : "최소: 미설정"}
                  </div>

                  {/* 🎯 미니 진행률 바 */}
                  <div className="w-full max-w-16 mt-1">
                    <div className="w-full bg-slate-200 rounded-full h-1">
                      <div
                        className={`h-1 rounded-full transition-all duration-300 ${
                          !item.minStock || item.minStock <= 0
                            ? "bg-slate-400"
                            : item.stock <= item.minStock
                            ? "bg-red-400"
                            : item.stock <= item.minStock * 1.5
                            ? "bg-amber-400"
                            : "bg-emerald-400"
                        }`}
                        style={{
                          width: `${
                            !item.minStock || item.minStock <= 0
                              ? Math.min((item.stock / 10) * 100, 100)
                              : Math.min(
                                  (item.stock / (item.minStock * 2)) * 100,
                                  100
                                )
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* 🎯 유통기한 - 2열 */}
                <div className="col-span-2 flex flex-col items-center justify-center">
                  {item.expiryDate ? (
                    <>
                      <div className="text-sm font-medium text-slate-900">
                        {new Date(item.expiryDate).toLocaleDateString("ko-KR")}
                      </div>
                      {expiryStatus && (
                        <div className={`text-xs mt-1 ${statusInfo.color}`}>
                          {expiryStatus.message}
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="text-sm font-medium text-slate-400">
                        -
                      </div>
                      <div className="text-xs text-slate-500 mt-1">미설정</div>
                    </>
                  )}
                </div>

                {/* 🎯 가격 - 2열 */}
                <div className="col-span-2 flex flex-col items-center justify-center">
                  {item.defaultPrice ? (
                    <>
                      <div className="text-sm font-semibold text-slate-900">
                        {item.defaultPrice.toLocaleString()}원
                      </div>
                      <div className="text-xs text-slate-500 mt-1">단가</div>
                    </>
                  ) : (
                    <>
                      <div className="text-sm font-medium text-slate-400">
                        -
                      </div>
                      <div className="text-xs text-slate-500 mt-1">미설정</div>
                    </>
                  )}
                </div>

                {/* 🎯 상태 - 1열 */}
                <div className="col-span-1 flex items-center justify-center">
                  <span
                    className={`
                      inline-flex items-center gap-1 px-2 py-1 rounded-full
                      text-xs font-medium ${statusInfo.badgeColor}
                    `}
                  >
                    <StatusIcon className="w-3 h-3" />
                    {statusInfo.label}
                  </span>
                </div>

                {/* 🎯 작업 - 1열 */}
                {permission === "use" && (
                  <div className="col-span-1 flex items-center justify-center">
                    {item.stock > 0 ? (
                      <button
                        onClick={() => onUseItem(item)}
                        className="
                          inline-flex items-center gap-1 px-3 py-1.5
                          bg-slate-900 hover:bg-slate-800 text-white
                          text-xs font-medium rounded-md
                          transition-colors duration-200
                          focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2
                        "
                      >
                        <ShoppingCart className="w-3 h-3" />
                        사용
                      </button>
                    ) : (
                      <div
                        className="
                        inline-flex items-center gap-1 px-3 py-1.5
                        bg-slate-100 text-slate-500
                        text-xs font-medium rounded-md cursor-not-allowed
                      "
                      >
                        <Package className="w-3 h-3" />
                        없음
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 🎯 테이블 푸터 (아이템 개수 표시) */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="text-xs text-slate-600">
              총 {items.length}개 아이템
            </div>
            <div className="text-xs text-slate-500">
              마지막 업데이트: {new Date().toLocaleTimeString("ko-KR")}
            </div>
          </div>
        </div>
      </div>
    );
  }
);

SharedItemList.displayName = "SharedItemList";
