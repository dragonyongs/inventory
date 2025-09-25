// src/components/dashboard/AlertsSection.tsx
import React from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  Calendar,
  CheckCircle,
  ChevronRight,
} from "lucide-react";

interface AlertItem {
  id: string;
  name: string;
  currentStock: number;
  minStock?: number; // undefined 허용
  type: "low_stock" | "expiring";
  expiryDate?: string;
}

interface AlertsSectionProps {
  lowStockItems: AlertItem[];
  expiringItems: AlertItem[];
}

export const AlertsSection: React.FC<AlertsSectionProps> = React.memo(
  ({ lowStockItems, expiringItems }) => {
    const EmptyAlert: React.FC<{
      icon: React.ComponentType<any>;
      title: string;
      description: string;
      iconColor: string;
    }> = ({ icon: Icon, title, description, iconColor }) => (
      <div className="text-center py-6">
        <Icon className={`w-8 h-8 ${iconColor} mx-auto mb-3`} />
        <p className="text-sm font-medium text-gray-900 mb-1">{title}</p>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
    );

    return (
      <div className="grid grid-cols-1 gap-6 h-full">
        {/* 재고 부족 알림 */}
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <h3 className="text-lg font-semibold text-gray-900">재고 부족</h3>
              {lowStockItems.length > 0 && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                  {lowStockItems.length}
                </span>
              )}
            </div>
          </div>

          <div className="p-6">
            {lowStockItems.length === 0 ? (
              <EmptyAlert
                icon={CheckCircle}
                title="재고 부족 품목이 없습니다"
                description="모든 재고가 안전합니다"
                iconColor="text-green-500"
              />
            ) : (
              <div className="space-y-0">
                {lowStockItems.slice(0, 5).map((item, index) => {
                  const minStock = item.minStock || 5; // 기본값 5
                  return (
                    <div
                      key={`${item.id}-${index}`}
                      className={`flex items-center justify-between py-3 hover:bg-gray-50 transition-colors rounded-lg -mx-2 px-2 ${
                        index !== lowStockItems.length - 1 && index < 4
                          ? "border-b border-gray-100"
                          : ""
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="p-1.5 bg-amber-50 rounded-md border border-amber-100">
                          <AlertTriangle className="w-4 h-4 text-amber-500" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {item.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            현재: {item.currentStock}개 / 최소: {minStock}개
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-semibold text-amber-600">
                          {item.currentStock}
                        </span>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                  );
                })}

                {lowStockItems.length > 5 && (
                  <div className="pt-4 border-t border-gray-100">
                    <Link
                      to="/inventory?filter=low"
                      className="block w-full text-center py-2 text-sm text-amber-600 hover:text-amber-800 font-medium hover:bg-amber-50 rounded-lg transition-colors"
                    >
                      전체 {lowStockItems.length}개 보기
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 유통기한 임박 알림 */}
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-orange-500" />
              <h3 className="text-lg font-semibold text-gray-900">
                유통기한 임박
              </h3>
              {expiringItems.length > 0 && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                  {expiringItems.length}
                </span>
              )}
            </div>
          </div>

          <div className="p-6">
            {expiringItems.length === 0 ? (
              <EmptyAlert
                icon={CheckCircle}
                title="유통기한 임박 품목이 없습니다"
                description="모든 상품의 유통기한이 충분합니다"
                iconColor="text-green-500"
              />
            ) : (
              <div className="space-y-0">
                {expiringItems.slice(0, 5).map((item, index) => {
                  const expiryDate = item.expiryDate
                    ? new Date(item.expiryDate)
                    : null;
                  const daysLeft = expiryDate
                    ? Math.ceil(
                        (expiryDate.getTime() - Date.now()) /
                          (1000 * 60 * 60 * 24)
                      )
                    : null;

                  return (
                    <div
                      key={`${item.id}-${index}`}
                      className={`flex items-center justify-between py-3 hover:bg-gray-50 transition-colors rounded-lg -mx-2 px-2 ${
                        index !== expiringItems.length - 1 && index < 4
                          ? "border-b border-gray-100"
                          : ""
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="p-1.5 bg-orange-50 rounded-md border border-orange-100">
                          <Calendar className="w-4 h-4 text-orange-500" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {item.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {daysLeft !== null
                              ? daysLeft > 0
                                ? `${daysLeft}일 후 만료`
                                : daysLeft === 0
                                ? "오늘 만료"
                                : `${Math.abs(daysLeft)}일 지남`
                              : "날짜 미확인"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            daysLeft !== null && daysLeft <= 0
                              ? "bg-red-100 text-red-800"
                              : "bg-orange-100 text-orange-800"
                          }`}
                        >
                          {daysLeft !== null && daysLeft <= 0 ? "만료" : "임박"}
                        </span>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                  );
                })}

                {expiringItems.length > 5 && (
                  <div className="pt-4 border-t border-gray-100">
                    <Link
                      to="/inventory?filter=expiring"
                      className="block w-full text-center py-2 text-sm text-orange-600 hover:text-orange-800 font-medium hover:bg-orange-50 rounded-lg transition-colors"
                    >
                      전체 {expiringItems.length}개 보기
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
);

AlertsSection.displayName = "AlertsSection";
