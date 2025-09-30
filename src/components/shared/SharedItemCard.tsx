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

// ✅ 재고 퍼센티지 계산
const calculateStockPercentage = (item: Item): number => {
  // 재고가 0이면 0%
  if (item.stock === 0) return 0;

  // 1. ⭐ maxStock이 있으면 무조건 이것을 사용 (최우선)
  if (item.maxStock && item.maxStock > 0) {
    return Math.min((item.stock / item.maxStock) * 100, 100);
  }

  // 2. maxStock이 없고 minStock만 있는 경우
  if (item.minStock && item.minStock > 0) {
    // minStock의 2배를 '정상 수준'으로 가정
    const normalLevel = item.minStock * 2;
    return Math.min((item.stock / normalLevel) * 100, 100);
  }

  // 3. 둘 다 없는 경우: 현재 재고를 100%로 간주
  return 100;
};

// ✅ 재고 라벨 텍스트
const getStockLabel = (item: Item): string => {
  if (item.maxStock && item.maxStock > 0) {
    return `현재: ${item.stock}개 / ${item.maxStock}개`;
  }

  if (item.minStock && item.minStock > 0) {
    return `보유: ${item.stock}개`;
  }

  return `보유: ${item.stock}개`;
};

// ✅ 프로그레스바 색상
const getProgressBarColor = (item: Item, percentage: number): string => {
  // 재고가 0이면 빨간색
  if (item.stock === 0) return "bg-red-500";

  // minStock이 설정되어 있으면 그것을 기준으로 판단 (최우선)
  if (item.minStock && item.minStock > 0) {
    if (item.stock <= item.minStock) {
      // 최소 재고 이하: 빨간색
      return "bg-red-500";
    } else if (item.stock <= item.minStock * 1.5) {
      // 최소 재고의 1.5배 이하: 노란색
      return "bg-amber-500";
    } else {
      // 최소 재고의 1.5배 초과: 초록색
      return "bg-green-500";
    }
  }

  // minStock이 없으면 퍼센티지로만 판단
  if (percentage >= 70) return "bg-green-500";
  if (percentage >= 40) return "bg-amber-500";
  return "bg-red-500";
};
export const SharedItemCard: React.FC<SharedItemCardProps> = React.memo(
  ({ items, permission, onUseItem }) => {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
        {items.map((item) => {
          const expiryStatus = item.expiryDate
            ? getExpiryStatus(item.expiryDate)
            : null;
          const isLowStock = item.stock <= (item.minStock || 0);

          // 🔧 상태 정보 계산
          const statusInfo = getStatusInfo(item, expiryStatus, isLowStock);
          const StatusIcon = statusInfo.icon;

          // ✅ 재고 관련 계산
          const stockPercentage = calculateStockPercentage(item);
          const stockLabel = getStockLabel(item);
          const progressBarColor = getProgressBarColor(item, stockPercentage);

          return (
            <div
              key={item.id}
              className={`
                relative flex flex-col
                rounded-lg ${statusInfo.borderColor}
                ${statusInfo.bgColor}
                shadow-sm hover:shadow-md
                transition-all duration-200
                overflow-hidden
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
              <div className="flex-1 flex flex-col p-4 gap-3">
                {/* 🎯 헤더 영역 - 컴팩트한 레이아웃 */}
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-base font-bold text-slate-900 line-clamp-2 flex-1">
                    {item.name}
                  </h3>

                  {/* 식별 코드 - 작고 깔끔하게 */}
                  <div className="flex flex-col gap-1 items-end shrink-0">
                    {item.sku && (
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <Hash className="w-3 h-3" />
                        <span className="font-mono">{item.sku}</span>
                      </div>
                    )}
                    {item.barcode && (
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <Barcode className="w-3 h-3" />
                        <span className="font-mono">{item.barcode}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 상태 배지 - 소프트한 디자인 */}
                <div className="flex items-center gap-2">
                  <span
                    className={`
                      inline-flex items-center gap-1.5 px-2.5 py-1
                      rounded-full text-xs font-medium
                      ${statusInfo.badgeColor}
                    `}
                  >
                    <StatusIcon className="w-3.5 h-3.5" />
                    {statusInfo.label}
                  </span>
                </div>

                {/* 🎯 메인 정보 영역 - 2x2 그리드, flex-1로 공간 확보 */}
                <div className="grid grid-cols-2 gap-2 flex-1">
                  {/* 재고 수량 */}
                  <div className="bg-slate-50 rounded-lg p-3 flex flex-col items-center justify-center border border-slate-100">
                    <div className="text-2xl font-bold text-slate-900">
                      {item.stock.toLocaleString()}
                    </div>
                    <div className="text-xs text-slate-600 mt-1">재고</div>
                  </div>

                  {/* 🔧 단가 정보 - 없을 때도 회색 박스 유지하며 '-' 표시 */}
                  {item.defaultPrice ? (
                    <div className="bg-slate-50 rounded-lg p-3 flex flex-col items-center justify-center border border-slate-100">
                      <div className="text-2xl font-bold text-slate-900">
                        {item.defaultPrice.toLocaleString()}
                      </div>
                      <div className="text-xs text-slate-600 mt-1">
                        단가 (원)
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-50 rounded-lg p-3 flex flex-col items-center justify-center border border-slate-100">
                      <div className="text-2xl font-bold text-slate-400">-</div>
                      <div className="text-xs text-slate-600 mt-1">
                        단가 (원)
                      </div>
                    </div>
                  )}

                  {/* 🔧 유통기한 - 없을 때도 회색 박스 유지하며 '-' 표시 */}
                  {item.expiryDate ? (
                    <div className="col-span-2 bg-slate-50 rounded-lg p-3 flex flex-col items-center justify-center border border-slate-100">
                      <div className="text-base font-semibold text-slate-900">
                        {new Date(item.expiryDate).toLocaleDateString("ko-KR")}
                      </div>
                      <div className="text-xs text-slate-600 mt-1">
                        유통기한
                      </div>
                    </div>
                  ) : (
                    <div className="col-span-2 bg-slate-50 rounded-lg p-3 flex flex-col items-center justify-center border border-slate-200">
                      <div className="text-base font-semibold text-slate-400">
                        -
                      </div>
                      <div className="text-xs text-slate-600 mt-1">
                        유통기한
                      </div>
                    </div>
                  )}
                </div>

                {/* ✅ 진행률 바 - 개선된 로직 */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700">
                      재고 현황
                    </span>
                    <span className="text-slate-600">{stockLabel}</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-full ${progressBarColor} transition-all duration-300`}
                      style={{
                        width: `${stockPercentage}%`,
                      }}
                    />
                  </div>
                  {/* ✅ 최소 재고 정보 표시 */}
                  {item.minStock && item.minStock > 0 && (
                    <div className="text-xs text-slate-500 text-center">
                      최소 수량: {item.minStock}개
                    </div>
                  )}
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
                    <div className="w-full text-center py-3 text-sm text-slate-400 font-medium border border-slate-200 rounded-lg bg-slate-50">
                      재고 없음
                    </div>
                  )
                ) : (
                  <div className="w-full text-center py-3 text-sm text-slate-500 font-medium border border-slate-200 rounded-lg bg-slate-50">
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
