// src/components/dashboard/AlertsSection.tsx
import React from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, Calendar, CheckCircle } from "lucide-react";

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
      <div className="text-center py-8">
        <Icon className={`w-8 h-8 ${iconColor} mx-auto mb-2`} />
        <p className="text-sm text-gray-500">{title}</p>
        <p>{description}</p>
      </div>
    );

    return (
      <div className="grid grid-cols-1 md:grid-row-2 gap-6 h-full">
        {/* 재고 부족 알림 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-red-600" />
              재고 부족 알림
              {lowStockItems.length > 0 && (
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  {lowStockItems.length}
                </span>
              )}
            </h3>
          </div>

          <div className="p-6">
            {lowStockItems.length === 0 ? (
              <EmptyAlert
                icon={CheckCircle}
                title="재고 부족 품목이 없습니다."
                description="모든 재고가 안전합니다."
                iconColor="text-green-500"
              />
            ) : (
              <div className="space-y-3">
                {lowStockItems.slice(0, 5).map((item, index) => {
                  const minStock = item.minStock || 5; // 기본값 5
                  return (
                    <div
                      key={`${item.id}-${index}`}
                      className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100 hover:bg-red-100 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="p-1 bg-red-100 rounded">
                          <AlertTriangle className="w-4 h-4 text-red-600" />
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-900">
                            {item.name}
                          </span>
                          <div className="text-xs text-gray-500">
                            현재: {item.currentStock}개 / 최소: {minStock}개
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-semibold text-red-600">
                          {item.currentStock}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {lowStockItems.length > 5 && (
                  <Link
                    to="/inventory?filter=low"
                    className="block w-full text-center py-2 text-sm text-red-600 hover:text-red-800 font-medium"
                  >
                    전체 보기
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 유통기한 임박 알림 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-orange-600" />
              유통기한 임박
              {expiringItems.length > 0 && (
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                  {expiringItems.length}
                </span>
              )}
            </h3>
          </div>

          <div className="p-6">
            {expiringItems.length === 0 ? (
              <EmptyAlert
                icon={CheckCircle}
                title="유통기한 임박 품목이 없습니다."
                description="모든 상품의 유통기한이 충분합니다."
                iconColor="text-green-500"
              />
            ) : (
              <div className="space-y-3">
                {expiringItems.slice(0, 5).map((item, index) => (
                  <div
                    key={`${item.id}-${index}`}
                    className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-100 hover:bg-orange-100 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-1 bg-orange-100 rounded">
                        <Calendar className="w-4 h-4 text-orange-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {item.name}
                      </span>
                    </div>
                    <div>
                      <span className="inline-flex items-center px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded-full">
                        유통기한 임박
                      </span>
                    </div>
                  </div>
                ))}

                {expiringItems.length > 5 && (
                  <Link
                    to="/inventory?filter=expiring"
                    className="block w-full text-center py-2 text-sm text-orange-600 hover:text-orange-800 font-medium"
                  >
                    전체 보기
                  </Link>
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
