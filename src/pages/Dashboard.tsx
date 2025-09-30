// src/pages/Dashboard.tsx
import React, { useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Package,
  TrendingUp,
  AlertTriangle,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
} from "lucide-react";

// 분리된 컴포넌트들 import
import { OnboardingCard } from "../components/dashboard/OnboardingCard";
import { TipsCard } from "../components/dashboard/TipsCard";
import { EmptyState } from "../components/dashboard/EmptyState";
import { buildOnboardingState } from "../services/onboarding";

// Store hooks
import {
  useItemList,
  useMovementList,
  useAllStockByItems,
  useAllExpiringItems,
} from "../stores/selectors";
import { useWorkspaceStore } from "../stores/workspaceStore";

// Modern Stats Card Component
const StatsCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: { value: number; label: string };
  onClick?: () => void;
}> = ({ title, value, icon, trend, onClick }) => (
  <div
    className={`bg-white border border-gray-200 rounded-lg p-6 hover:border-gray-300 transition-colors ${
      onClick ? "cursor-pointer" : ""
    }`}
    onClick={onClick}
  >
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-gray-50 rounded-lg text-gray-600">{icon}</div>
        <div>
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
        </div>
      </div>
      {trend && (
        <div className="text-right">
          <div className="flex items-center space-x-1">
            {trend.value > 0 ? (
              <ArrowUpRight className="w-4 h-4 text-green-500" />
            ) : (
              <ArrowDownRight className="w-4 h-4 text-red-500" />
            )}
            <span
              className={`text-sm font-medium ${
                trend.value > 0 ? "text-green-500" : "text-red-500"
              }`}
            >
              {Math.abs(trend.value)}%
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1">{trend.label}</p>
        </div>
      )}
    </div>
  </div>
);

// Modern Activity Item Component
const ActivityItem: React.FC<{
  activity: any;
  isLast?: boolean;
}> = ({ activity, isLast }) => {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case "in":
        return <ArrowDownRight className="w-4 h-4 text-green-500" />;
      case "out":
        return <ArrowUpRight className="w-4 h-4 text-red-500" />;
      default:
        return <Package className="w-4 h-4 text-gray-400" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) return "방금 전";
    if (diffInHours < 24) return `${diffInHours}시간 전`;
    return date.toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
  };

  return (
    <div
      className={`flex items-center space-x-3 py-3 ${
        !isLast ? "border-b border-gray-100" : ""
      }`}
    >
      <div className="p-1.5 bg-gray-50 rounded-md">
        {getActivityIcon(activity.type)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">
          {activity.itemName}
        </p>
        <p className="text-xs text-gray-500">
          {activity.type === "in" ? "입고" : "출고"} • {activity.quantity}개
        </p>
      </div>
      <div className="text-right">
        <p className="text-xs text-gray-400">
          {formatDate(activity.createdAt)}
        </p>
      </div>
    </div>
  );
};

// Modern Alert Item Component
const AlertItem: React.FC<{
  alert: any;
  type: "low_stock" | "expiring";
  isLast?: boolean;
}> = ({ alert, type, isLast }) => (
  <div
    className={`flex items-center space-x-3 py-3 ${
      !isLast ? "border-b border-gray-100" : ""
    }`}
  >
    <div className="p-1.5 bg-amber-50 rounded-md">
      <AlertTriangle className="w-4 h-4 text-amber-500" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-gray-900 truncate">{alert.name}</p>
      <p className="text-xs text-gray-500">
        {type === "low_stock"
          ? `재고 부족 • ${alert.currentStock}개 남음`
          : `유통기한 임박 • ${
              alert.expiryDate
                ? new Date(alert.expiryDate).toLocaleDateString("ko-KR")
                : "날짜 미확인"
            }`}
      </p>
    </div>
    <ChevronRight className="w-4 h-4 text-gray-400" />
  </div>
);

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const items = useItemList();
  const movements = useMovementList();
  const allStockByItems = useAllStockByItems();
  const expiringItemsSet = useAllExpiringItems(30);
  const { getCurrentWorkspace, isInitialized } = useWorkspaceStore();
  const currentWorkspace = getCurrentWorkspace();

  // 통계 계산 (메모이제이션)
  const stats = useMemo(() => {
    if (!items || !movements) {
      return {
        totalItems: 0,
        lowStockItems: 0,
        recentMovements: 0,
        totalStock: 0,
      };
    }

    const totalItems = items.length;

    // stockByItemsArray 처리
    let stockByItemsArray: any[];
    if (Array.isArray(allStockByItems)) {
      stockByItemsArray = allStockByItems;
    } else if (allStockByItems && typeof allStockByItems === "object") {
      stockByItemsArray = items.map((item) => ({
        ...item,
        stock: allStockByItems[item.id] || 0,
      }));
    } else {
      stockByItemsArray = items.map((item) => ({
        ...item,
        stock: item.stock || 0,
      }));
    }

    // 재고 부족 상품 계산
    const lowStockItems = stockByItemsArray.filter((item: any) => {
      const currentStock = item.stock || 0;
      const minStock = item.minStock || 5;
      return currentStock <= minStock;
    }).length;

    // 최근 7일 움직임 계산
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentMovements = movements.filter((m: any) => {
      const movementDate = new Date(m.createdAt);
      return movementDate >= sevenDaysAgo;
    }).length;

    // 총 재고 계산
    let totalStock = 0;
    if (Array.isArray(allStockByItems)) {
      totalStock = allStockByItems.reduce(
        (sum, item: any) => sum + (item.stock || 0),
        0
      );
    } else if (allStockByItems && typeof allStockByItems === "object") {
      totalStock = Object.values(allStockByItems).reduce(
        (sum: number, stock: any) => sum + (stock || 0),
        0
      );
    } else {
      totalStock = items.reduce((sum, item: any) => sum + (item.stock || 0), 0);
    }

    return {
      totalItems,
      lowStockItems,
      recentMovements,
      totalStock,
    };
  }, [items, movements, allStockByItems]);

  // 온보딩 상태 계산
  const onboardingState = useMemo(() => {
    return buildOnboardingState({
      totalItems: stats.totalItems,
      hasMovement: stats.recentMovements > 0,
      alertsEnabled: false,
    });
  }, [stats.totalItems, stats.recentMovements]);

  // 최근 활동 내역 계산 (메모이제이션)
  const recentActivity = useMemo(() => {
    if (!movements || !Array.isArray(movements)) {
      return [];
    }

    try {
      const sorted = [...movements]
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        .slice(0, 6);

      const enriched = sorted.map((m: any) => ({
        ...m,
        itemName: m.itemName || "알 수 없는 상품",
        isItemDeleted: m.isItemDeleted || false,
      }));

      return enriched;
    } catch (error) {
      console.error("recentActivity 계산 중 오류:", error);
      return [];
    }
  }, [movements]);

  // 유통기한 임박 상품 계산
  const expiringItems = useMemo(() => {
    if (!expiringItemsSet || !items) {
      return [];
    }

    let expiringIds: string[] = [];

    try {
      if (expiringItemsSet instanceof Set) {
        expiringIds = Array.from(expiringItemsSet);
      } else if (Array.isArray(expiringItemsSet)) {
        expiringIds = (expiringItemsSet as Array<{ id: string }>).map(
          (item) => item.id
        );
      } else if (
        typeof expiringItemsSet === "object" &&
        expiringItemsSet !== null
      ) {
        const entries = Object.entries(expiringItemsSet);
        if (entries.length > 0) {
          expiringIds = entries.map(([key]) => key);
        } else {
          return [];
        }
      } else {
        return [];
      }
    } catch (error) {
      console.error("expiringItems 계산 중 오류:", error);
      return [];
    }

    if (!Array.isArray(items)) {
      return [];
    }

    return items
      .filter((item: any) => item && item.id && expiringIds.includes(item.id))
      .slice(0, 5);
  }, [expiringItemsSet, items]);

  // 재고 부족 상품 계산
  const lowStockItems = useMemo(() => {
    if (!items || !Array.isArray(items)) {
      return [];
    }

    try {
      return items
        .filter((item: any) => {
          if (!item || typeof item !== "object") return false;

          let currentStock = 0;
          if (allStockByItems && typeof allStockByItems === "object") {
            currentStock = allStockByItems[item.id] || item.stock || 0;
          } else {
            currentStock = item.stock || 0;
          }

          const minStock = item.minStock || 5;
          return currentStock <= minStock;
        })
        .slice(0, 5);
    } catch (error) {
      console.error("lowStockItems 계산 중 오류:", error);
      return [];
    }
  }, [items, allStockByItems]);

  // 알림 데이터 계산 (메모이제이션)
  const alertData = useMemo(() => {
    const lowStockAlerts = lowStockItems.map((item: any) => ({
      id: item.id,
      name: item.name,
      currentStock:
        allStockByItems && typeof allStockByItems === "object"
          ? allStockByItems[item.id] || 0
          : item.stock || 0,
      minStock: item.minStock,
      type: "low_stock" as const,
    }));

    const expiringAlerts = expiringItems.map((item: any) => ({
      id: item.id,
      name: item.name,
      currentStock:
        allStockByItems && typeof allStockByItems === "object"
          ? allStockByItems[item.id] || 0
          : item.stock || 0,
      minStock: item.minStock,
      type: "expiring" as const,
      expiryDate: item.expiryDate,
    }));

    return { lowStockItems: lowStockAlerts, expiringItems: expiringAlerts };
  }, [lowStockItems, expiringItems, allStockByItems]);

  // 콜백 함수들
  const handleOnboardingAction = useCallback(
    (step: string) => {
      switch (step) {
        case "addItem":
          navigate("/inventory/new");
          break;
        case "recordMovement":
          navigate("/movements/new");
          break;
        case "enableAlerts":
          navigate("/settings?tab=alerts");
          break;
      }
    },
    [navigate]
  );

  const handleBulkImport = useCallback(() => {
    navigate("/inventory/bulk");
  }, [navigate]);

  // 초기화 중이면 로딩 표시
  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-500">로딩 중...</p>
        </div>
      </div>
    );
  }

  // 워크스페이스가 없는 경우
  if (!currentWorkspace) {
    return <EmptyState hasWorkspace={false} />;
  }

  // 상품이 없는 경우
  if (stats.totalItems === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto p-6 lg:p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">
              {currentWorkspace?.name || "대시보드"}
            </h1>
            <p className="text-gray-500">재고 관리를 시작해보세요</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 mb-8">
            <OnboardingCard
              state={onboardingState}
              onAction={handleOnboardingAction}
            />
            <TipsCard onBulkImport={handleBulkImport} />
          </div>

          <EmptyState hasWorkspace={true} />
        </div>
      </div>
    );
  }

  const totalAlerts =
    alertData.lowStockItems.length + alertData.expiringItems.length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 mb-2">
                {currentWorkspace?.name || "대시보드"}
              </h1>
              <p className="text-gray-500">전체적인 재고 현황을 확인하세요</p>
            </div>
            <div className="flex-shrink-0 w-full sm:w-auto">
              <button
                onClick={() => navigate("/inventory/new")}
                className="inline-flex items-center px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                상품 추가
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="전체 상품"
            value={stats.totalItems}
            icon={<Package className="w-5 h-5" />}
            onClick={() => navigate("/inventory")}
          />
          <StatsCard
            title="총 재고"
            value={stats.totalStock.toLocaleString()}
            icon={<TrendingUp className="w-5 h-5" />}
          />
          <StatsCard
            title="주의 알림"
            value={totalAlerts}
            icon={<AlertTriangle className="w-5 h-5" />}
          />
          <StatsCard
            title="최근 활동"
            value={stats.recentMovements}
            icon={<Calendar className="w-5 h-5" />}
            trend={{ value: 12, label: "지난 주 대비" }}
          />
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <div className="bg-white border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  최근 활동
                </h3>
                <button
                  onClick={() => navigate("/movements")}
                  className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  전체 보기
                </button>
              </div>
              <div className="p-6">
                {recentActivity.length > 0 ? (
                  <div className="space-y-0">
                    {recentActivity.map((activity, index) => (
                      <ActivityItem
                        key={activity.id}
                        activity={activity}
                        isLast={index === recentActivity.length - 1}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">최근 활동이 없습니다</p>
                    <p className="text-sm text-gray-400">
                      상품을 추가하고 입출고를 기록해보세요
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Alerts */}
          <div>
            <div className="bg-white border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  주의 알림
                </h3>
                {totalAlerts > 0 && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                    {totalAlerts}
                  </span>
                )}
              </div>
              <div className="p-6">
                {totalAlerts > 0 ? (
                  <div className="space-y-0">
                    {[...alertData.lowStockItems, ...alertData.expiringItems]
                      .slice(0, 8)
                      .map((alert, index, array) => (
                        <AlertItem
                          key={alert.id}
                          alert={alert}
                          type={alert.type}
                          isLast={index === array.length - 1}
                        />
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">알림이 없습니다</p>
                    <p className="text-sm text-gray-400">
                      모든 상품이 정상 상태입니다
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Onboarding & Tips */}
        <div className="grid lg:grid-cols-2 gap-8 mt-8">
          {!onboardingState.allDone && (
            <OnboardingCard
              state={onboardingState}
              onAction={handleOnboardingAction}
            />
          )}
          <TipsCard onBulkImport={handleBulkImport} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
