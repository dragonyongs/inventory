// src/pages/Dashboard.tsx
import React, { useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";

// 분리된 컴포넌트들 import
import { OnboardingCard } from "../components/dashboard/OnboardingCard";
import { TipsCard } from "../components/dashboard/TipsCard";
import { EmptyState } from "../components/dashboard/EmptyState";
import { StatsCards } from "../components/dashboard/StatsCards";
import { RecentActivity } from "../components/dashboard/RecentActivity";
import { AlertsSection } from "../components/dashboard/AlertsSection";
import { buildOnboardingState } from "../services/onboarding";

// Store hooks
import {
  useItemList,
  useMovementList,
  useAllStockByItems,
  useAllExpiringItems,
} from "../stores/selectors";
import { useWorkspaceStore } from "../stores/workspaceStore";

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
      const minStock = item.minStock || 5; // undefined일 경우 기본값 5
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
      alertsEnabled: false, // 알림 설정 여부 - 필요에 따라 스토어에서 가져오기
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
        .slice(0, 8);

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

          const minStock = item.minStock || 5; // undefined일 경우 기본값 5
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
      minStock: item.minStock, // undefined 허용
      type: "low_stock" as const,
    }));

    const expiringAlerts = expiringItems.map((item: any) => ({
      id: item.id,
      name: item.name,
      currentStock:
        allStockByItems && typeof allStockByItems === "object"
          ? allStockByItems[item.id] || 0
          : item.stock || 0,
      minStock: item.minStock, // undefined 허용
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
    return <div className="p-8 text-center">로딩 중...</div>;
  }

  // 워크스페이스가 없는 경우
  if (!currentWorkspace) {
    return <EmptyState hasWorkspace={false} />;
  }

  // 상품이 없는 경우
  if (stats.totalItems === 0) {
    return (
      <div className="space-y-6 p-4 lg:p-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">
            {currentWorkspace?.name || "대시보드"}
          </h1>
        </div>

        <div className="grid grid-cols-2 gap-8">
          <OnboardingCard
            state={onboardingState}
            onAction={handleOnboardingAction}
          />

          <TipsCard onBulkImport={handleBulkImport} />
        </div>
        <EmptyState hasWorkspace={true} />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      {/* 헤더 */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {currentWorkspace?.name || "대시보드"}
              </h1>
              <p className="text-gray-600">
                {currentWorkspace?.name || "워크스페이스"}의 전체적인 재고 상태
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 통계 카드들 */}
      <StatsCards stats={stats} />

      {/* 최근 활동과 알림 섹션 */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <RecentActivity
          activities={recentActivity}
          currentWorkspace={currentWorkspace}
        />
        <div>
          <AlertsSection
            lowStockItems={alertData.lowStockItems}
            expiringItems={alertData.expiringItems}
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-x-8">
        {/* 온보딩 카드 (완료되지 않은 경우만) */}
        {!onboardingState.allDone && (
          <div className="mb-8">
            <OnboardingCard
              state={onboardingState}
              onAction={handleOnboardingAction}
            />
          </div>
        )}

        {/* 팁 카드 */}
        <div className="mb-8">
          <TipsCard onBulkImport={handleBulkImport} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
