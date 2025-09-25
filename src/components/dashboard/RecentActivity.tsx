// src/components/dashboard/RecentActivity.tsx
import React from "react";
import {
  ArrowUpRight,
  ArrowDownLeft,
  Activity,
  Clock,
  Package,
} from "lucide-react";

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
          return <ArrowDownLeft className="w-4 h-4" />;
        case "OUT":
        case "USE":
          return <ArrowUpRight className="w-4 h-4" />;
        case "ADJUST":
          return <Activity className="w-4 h-4" />;
        default:
          return <Activity className="w-4 h-4" />;
      }
    };

    const getMovementColor = (type: MovementType) => {
      switch (type) {
        case "IN":
          return "text-green-600 bg-green-50 border-green-100";
        case "OUT":
        case "USE":
          return "text-red-600 bg-red-50 border-red-100";
        case "ADJUST":
          return "text-blue-600 bg-blue-50 border-blue-100";
        default:
          return "text-gray-600 bg-gray-50 border-gray-100";
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

    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      const now = new Date();
      const diffInHours = Math.floor(
        (now.getTime() - date.getTime()) / (1000 * 60 * 60)
      );

      if (diffInHours < 1) return "방금 전";
      if (diffInHours < 24) return `${diffInHours}시간 전`;
      return date.toLocaleDateString("ko-KR", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    };

    if (activities.length === 0) {
      return (
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">최근 활동</h3>
          </div>
          <div className="p-6">
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">최근 활동이 없습니다</p>
              <p className="text-sm text-gray-400 mt-1">
                상품을 추가하고 입출고를 기록해보세요
              </p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">최근 활동</h3>
        </div>

        <div className="p-6">
          <div className="space-y-0">
            {activities.map((activity, index) => (
              <div
                key={`${activity.id}-${index}`}
                className={`flex items-center space-x-3 py-3 hover:bg-gray-50 transition-colors rounded-lg -mx-2 px-2 ${
                  index !== activities.length - 1
                    ? "border-b border-gray-100"
                    : ""
                }`}
              >
                <div
                  className={`p-1.5 rounded-md border ${getMovementColor(
                    activity.type
                  )}`}
                >
                  {getMovementIcon(activity.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-medium truncate ${
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
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
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
                      <span className="text-xs text-gray-500 truncate">
                        {activity.reason}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <div
                    className={`text-sm font-semibold mb-1 ${
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

                  <div className="flex items-center text-xs text-gray-400">
                    <Clock className="w-3 h-3 mr-1" />
                    {formatDate(activity.createdAt)}
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
