// src/components/dashboard/AlertItem.tsx

import React from "react";
import { AlertTriangle, Calendar } from "lucide-react";

interface AlertItemProps {
  alert: {
    id: string;
    name: string;
    type: "low_stock" | "expiring";
    currentStock?: number;
    expiryDate?: string;
    minStock?: number;
  };
}

export const AlertItem: React.FC<AlertItemProps> = React.memo(({ alert }) => {
  const isLowStock = alert.type === "low_stock";

  return (
    <div
      className={`
        group flex items-start gap-3 rounded-lg border p-3.5
        transition-all duration-200 hover:shadow-md
        ${
          isLowStock
            ? "border-amber-200 bg-amber-50/50 hover:bg-amber-50 hover:border-amber-300"
            : "border-rose-200 bg-rose-50/50 hover:bg-rose-50 hover:border-rose-300"
        }
      `}
    >
      {/* 아이콘 영역 */}
      <div
        className={`
          flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg
          ${
            isLowStock
              ? "bg-amber-100 text-amber-600"
              : "bg-rose-100 text-rose-600"
          }
        `}
      >
        {isLowStock ? (
          <AlertTriangle className="h-5 w-5" />
        ) : (
          <Calendar className="h-5 w-5" />
        )}
      </div>

      {/* 알림 내용 */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-slate-900">
          {alert.name}
        </p>
        <p
          className={`
            mt-1 text-xs font-medium
            ${isLowStock ? "text-amber-700" : "text-rose-700"}
          `}
        >
          {isLowStock
            ? `재고 부족 • ${alert.currentStock || 0}개 남음`
            : `유통기한 임박 • ${
                alert.expiryDate
                  ? new Date(alert.expiryDate).toLocaleDateString("ko-KR")
                  : "날짜 미확인"
              }`}
        </p>
      </div>

      {/* 우측 인디케이터 */}
      <div
        className={`
          h-2 w-2 flex-shrink-0 self-center rounded-full
          ${isLowStock ? "bg-amber-500" : "bg-rose-500"}
        `}
      />
    </div>
  );
});

AlertItem.displayName = "AlertItem";
