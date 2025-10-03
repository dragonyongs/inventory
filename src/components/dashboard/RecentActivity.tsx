// src/components/dashboard/RecentActivity.tsx

import React from "react";
import { Clock, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useRelativeTime } from "../../hooks/useRelativeTime";

type MovementType = "IN" | "OUT" | "USE" | "ADJUST" | "TRANSFER" | "DELETE";

interface RecentActivityItem {
  id: string;
  itemName: string;
  itemSku?: string;
  isItemDeleted: boolean;
  type: MovementType;
  itemId: string;
  qty: number;
  reason?: string;
  createdAt: string;
  itemSnapshot?: any;
  userName?: string;
  userId?: string;
}

interface RecentActivityProps {
  activities: RecentActivityItem[];
  currentWorkspace?: any;
}

export const RecentActivity: React.FC<RecentActivityProps> = React.memo(
  ({ activities }) => {
    const getMovementLabel = (type: MovementType) => {
      const labels: Record<MovementType, string> = {
        IN: "입고",
        OUT: "출고",
        USE: "사용",
        ADJUST: "조정",
        TRANSFER: "이동",
        DELETE: "삭제",
      };
      return labels[type] || type;
    };

    if (!activities || activities.length === 0) {
      return (
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">최근 활동</h3>
          </div>

          <div className="flex flex-col items-center justify-center py-12">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-50">
              <Clock className="h-8 w-8 text-slate-300" />
            </div>
            <p className="mb-1 text-sm font-medium text-slate-900">
              최근 활동이 없습니다
            </p>
            <p className="text-sm text-slate-500">
              상품을 추가하고 입출고를 기록해보세요
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">최근 활동</h3>
          <Link
            to="/movements"
            className="group flex items-center gap-1.5 text-sm font-medium text-indigo-600 transition-colors hover:text-indigo-700"
          >
            전체 보기
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        <div className="space-y-3">
          {activities.map((activity) => (
            <ActivityItem
              key={activity.id}
              activity={activity}
              getMovementLabel={getMovementLabel}
            />
          ))}
        </div>
      </div>
    );
  }
);

RecentActivity.displayName = "RecentActivity";

// 개별 활동 아이템 컴포넌트
interface ActivityItemProps {
  activity: RecentActivityItem;
  getMovementLabel: (type: MovementType) => string;
}

const ActivityItem: React.FC<ActivityItemProps> = React.memo(
  ({ activity, getMovementLabel }) => {
    const { relativeTime, absoluteTime, isWithin24Hours } = useRelativeTime(
      activity.createdAt
    );

    const getTypeColor = (type: MovementType) => {
      const colors: Record<MovementType, string> = {
        IN: "bg-emerald-50 text-emerald-700 border-emerald-100",
        OUT: "bg-rose-50 text-rose-700 border-rose-100",
        USE: "bg-blue-50 text-blue-700 border-blue-100",
        ADJUST: "bg-amber-50 text-amber-700 border-amber-100",
        TRANSFER: "bg-purple-50 text-purple-700 border-purple-100",
        DELETE: "bg-slate-50 text-slate-700 border-slate-100",
      };
      return colors[type] || "bg-slate-50 text-slate-700 border-slate-100";
    };

    return (
      <div className="group flex items-start gap-3 rounded-lg border border-transparent md:p-3 transition-all hover:border-slate-200 hover:bg-slate-50/50">
        {/* 타입 배지 */}
        <div
          className={`
            mt-0.5 flex-shrink-0 rounded-md border px-2.5 py-1 text-xs font-medium
            ${getTypeColor(activity.type)}
          `}
        >
          {getMovementLabel(activity.type)}
        </div>

        {/* 활동 정보 */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-slate-900">
            {activity.itemName || "알 수 없는 상품"}
          </p>

          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-600">
            <span>{activity.userName || "알 수 없음"}</span>
            <span className="text-slate-300">•</span>
            <span
              className={`font-medium ${
                activity.type === "IN" ? "text-emerald-600" : "text-rose-600"
              }`}
            >
              {activity.type === "IN" ? "+" : "-"}
              {activity.qty}개
            </span>
          </div>

          {activity.reason && (
            <p className="mt-1.5 text-xs text-slate-500">
              사유: {activity.reason}
            </p>
          )}
        </div>

        {/* 시간 */}
        <div className="flex-shrink-0 text-xs text-slate-400">
          {isWithin24Hours ? relativeTime : absoluteTime}
        </div>
      </div>
    );
  }
);

ActivityItem.displayName = "ActivityItem";
