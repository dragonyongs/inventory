// src/components/shared/SharedItemCard.tsx

import React from "react";
import {
  Package,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Hash,
  Barcode,
  TrendingDown,
  ShoppingCart,
} from "lucide-react";
import { Item } from "@/stores/itemsStore";
import { getExpiryStatus } from "@/utils/expiryUtils";

interface SharedItemCardProps {
  items: Item[];
  permission: "view" | "use";
  onUseItem: (item: Item) => void;
}

// 🔧 상태 정보를 계산하는 헬퍼 함수 (useMemo를 대신)
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

export const SharedItemCard: React.FC<SharedItemCardProps> = React.memo(
  ({ items, permission, onUseItem }) => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
        {items.map((item) => {
          const expiryStatus = item.expiryDate
            ? getExpiryStatus(item.expiryDate)
            : null;
          const isLowStock = item.stock <= (item.minStock || 0);

          // 🔧 상태 정보 계산 (함수로 분리)
          const statusInfo = getStatusInfo(item, expiryStatus, isLowStock);
          const StatusIcon = statusInfo.icon;

          return (
            <div
              key={item.id}
              className={`
                relative overflow-hidden rounded-xl border transition-all duration-200
                ${statusInfo.bgColor} ${statusInfo.borderColor}
                hover:shadow-md hover:scale-[1.01]
                w-full max-w-sm mx-auto
                flex flex-col h-full
              `}
            >
              {/* 🎯 상단 상태 바 - 미니멀한 인디케이터 */}
              {statusInfo.severity > 0 && (
                <div
                  className={`h-1 w-full ${
                    statusInfo.severity >= 4
                      ? "bg-red-400"
                      : statusInfo.severity >= 3
                      ? "bg-amber-400"
                      : "bg-orange-400"
                  }`}
                />
              )}

              {/* 🎯 상단 컨텐츠 영역 - flex-1으로 최대 높이 확보 */}
              <div className="p-4 flex-1 flex flex-col">
                {/* 🎯 헤더 영역 - 컴팩트한 레이아웃 */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-slate-900 truncate mb-1">
                      {item.name}
                    </h3>

                    {/* 식별 코드 - 작고 깔끔하게 */}
                    <div className="flex gap-2 text-xs text-slate-500">
                      {item.sku && (
                        <span className="flex items-center gap-1">
                          <Hash className="w-3 h-3" />
                          {item.sku}
                        </span>
                      )}
                      {item.barcode && (
                        <span className="flex items-center gap-1">
                          <Barcode className="w-3 h-3" />
                          {item.barcode}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 상태 배지 - 소프트한 디자인 */}
                  <span
                    className={`
                      inline-flex items-center gap-1 px-2 py-1 rounded-full
                      text-xs font-medium ${statusInfo.badgeColor}
                      shrink-0
                    `}
                  >
                    <StatusIcon className="w-3 h-3" />
                    {statusInfo.label}
                  </span>
                </div>

                {/* 🎯 메인 정보 영역 - 2x2 그리드, flex-1로 공간 확보 */}
                <div className="flex-1 flex flex-col">
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {/* 재고 수량 */}
                    <div className="text-center p-3 bg-slate-50 rounded-lg">
                      <div className="text-2xl font-bold text-slate-900">
                        {item.stock.toLocaleString()}
                      </div>
                      <div className="text-xs text-slate-600 mt-1">재고</div>
                    </div>

                    {/* 🔧 단가 정보 - 없을 때도 회색 박스 유지하며 '-' 표시 */}
                    <div className="text-center p-3 bg-slate-50 rounded-lg">
                      {item.defaultPrice ? (
                        <>
                          <div className="text-lg font-semibold text-slate-900">
                            {item.defaultPrice.toLocaleString()}
                          </div>
                          <div className="text-xs text-slate-600 mt-1">
                            단가 (원)
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="text-lg font-medium text-slate-400">
                            -
                          </div>
                          <div className="text-xs text-slate-500 mt-1">
                            단가 (원)
                          </div>
                        </>
                      )}
                    </div>

                    {/* 🔧 유통기한 - 없을 때도 회색 박스 유지하며 '-' 표시 */}
                    <div className="text-center p-3 bg-slate-50 rounded-lg col-span-2">
                      {item.expiryDate ? (
                        <>
                          <div className="text-sm font-medium text-slate-900">
                            {new Date(item.expiryDate).toLocaleDateString(
                              "ko-KR"
                            )}
                          </div>
                          <div className="text-xs text-slate-600 mt-1">
                            유통기한
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="text-sm font-medium text-slate-400">
                            -
                          </div>
                          <div className="text-xs text-slate-500 mt-1">
                            유통기한
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* 🔧 진행률 바 - 항상 표시하되 최소수량에 따라 레이블 조정 */}
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-slate-600 mb-1">
                      <span>재고 현황</span>
                      <span>
                        {item.minStock && item.minStock > 0
                          ? `최소 수량: ${item.minStock}개`
                          : "최소 수량: 미설정"}
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          !item.minStock || item.minStock <= 0
                            ? "bg-slate-400" // 최소수량 미설정시 회색
                            : item.stock <= item.minStock
                            ? "bg-red-400"
                            : item.stock <= item.minStock * 1.5
                            ? "bg-amber-400"
                            : "bg-emerald-400"
                        }`}
                        style={{
                          width: `${
                            !item.minStock || item.minStock <= 0
                              ? Math.min((item.stock / 10) * 100, 100) // 최소수량 없으면 임시 기준(10개)
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
              </div>

              {/* 🎯 하단 버튼 영역 - 별도 구조로 분리하여 하단 고정 */}
              <div className="p-4 pt-0">
                {permission === "use" ? (
                  item.stock > 0 ? (
                    <button
                      onClick={() => onUseItem(item)}
                      className="
                        w-full flex items-center justify-center gap-2 px-4 py-3
                        bg-slate-900 hover:bg-slate-800 text-white
                        font-medium text-sm rounded-lg
                        transition-colors duration-200
                        focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2
                      "
                    >
                      <ShoppingCart className="w-4 h-4" />
                      사용하기
                    </button>
                  ) : (
                    <div
                      className="
                      w-full flex items-center justify-center gap-2 px-4 py-3
                      bg-slate-100 text-slate-500
                      font-medium text-sm rounded-lg cursor-not-allowed
                    "
                    >
                      <Package className="w-4 h-4" />
                      재고 없음
                    </div>
                  )
                ) : (
                  <div
                    className="
                    w-full flex items-center justify-center px-4 py-3
                    bg-slate-100 text-slate-500
                    font-medium text-sm rounded-lg
                  "
                  >
                    보기 전용
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }
);

SharedItemCard.displayName = "SharedItemCard";
