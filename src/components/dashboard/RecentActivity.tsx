// src/components/dashboard/RecentActivity.tsx
import React from "react";
import { ArrowUpRight, ArrowDownLeft, Activity, Clock } from "lucide-react";

// 기존 코드에서 사용하는 타입 정의
type MovementType = "IN" | "OUT" | "USE" | "ADJUST" | "TRANSFER";

interface RecentActivityItem {
  id: string;
  itemName: string;
  itemSku?: string;
  isItemDeleted: boolean;
  type: MovementType;
  itemId: string;
  qty: number;
  reason?: string;
  createdAt: string; // timestamp가 아닌 createdAt 사용
  itemSnapshot?: any;
}

interface RecentActivityProps {
  activities: RecentActivityItem[];
  currentWorkspace?: any;
}

export const RecentActivity: React.FC<RecentActivityProps> = React.memo(
  ({ activities }) => {
    const getMovementIcon = (type: MovementType) => {
      switch (type) {
        case "IN":
          return <ArrowUpRight className="w-4 h-4" />;
        case "OUT":
        case "USE":
          return <ArrowDownLeft className="w-4 h-4" />;
        case "ADJUST":
          return <Activity className="w-4 h-4" />;
        default:
          return <Activity className="w-4 h-4" />;
      }
    };

    const getMovementColor = (type: MovementType) => {
      switch (type) {
        case "IN":
          return "text-green-600 bg-green-50";
        case "OUT":
        case "USE":
          return "text-red-600 bg-red-50";
        case "ADJUST":
          return "text-blue-600 bg-blue-50";
        default:
          return "text-gray-600 bg-gray-50";
      }
    };

    const getMovementLabel = (type: MovementType) => {
      const defaultLabels = {
        IN: "입고",
        OUT: "출고",
        USE: "사용",
        ADJUST: "조정",
        TRANSFER: "이동",
      };

      return defaultLabels[type] || type;
    };

    if (activities.length === 0) {
      return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Activity className="w-5 h-5 mr-2 text-blue-600" />
              최근 활동 내역
            </h3>
          </div>

          <div className="text-center py-12">
            <Activity className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">최근 활동이 없습니다.</p>
            <p className="text-sm text-gray-400 mt-1">
              상품을 추가하고 입출고를 기록해보세요.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Activity className="w-5 h-5 mr-2 text-blue-600" />
            최근 활동 내역
          </h3>
        </div>

        <div className="p-6">
          <div className="space-y-4">
            {activities.map((activity, index) => (
              <div
                key={`${activity.id}-${index}`}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div
                    className={`p-2 rounded-lg ${getMovementColor(
                      activity.type
                    )}`}
                  >
                    {getMovementIcon(activity.type)}
                  </div>

                  <div>
                    <p
                      className={`font-medium ${
                        activity.itemName === "알 수 없는 상품"
                          ? "text-gray-500 italic"
                          : "text-gray-900"
                      }`}
                    >
                      {activity.itemName || "알 수 없는 상품"}
                      {activity.isItemDeleted && (
                        <span className="text-xs ml-2 text-red-500 bg-red-100 px-2 py-0.5 rounded-full">
                          삭제됨
                        </span>
                      )}
                    </p>

                    <div className="flex items-center space-x-2 mt-1">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          activity.type === "IN"
                            ? "bg-green-100 text-green-800"
                            : activity.type === "OUT" || activity.type === "USE"
                            ? "bg-red-100 text-red-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {getMovementLabel(activity.type)}
                      </span>
                      {activity.reason && (
                        <span className="text-xs text-gray-500">
                          {activity.reason}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div
                    className={`text-lg font-semibold ${
                      activity.type === "IN"
                        ? "text-green-600"
                        : activity.type === "OUT" || activity.type === "USE"
                        ? "text-red-600"
                        : "text-blue-600"
                    }`}
                  >
                    {activity.type === "IN"
                      ? "+"
                      : activity.type === "OUT" || activity.type === "USE"
                      ? "-"
                      : ""}
                    {activity.qty}
                  </div>

                  <div className="flex items-center text-xs text-gray-400 mt-1">
                    <Clock className="w-3 h-3 mr-1" />
                    {new Date(activity.createdAt).toLocaleDateString("ko-KR", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
);

RecentActivity.displayName = "RecentActivity";
