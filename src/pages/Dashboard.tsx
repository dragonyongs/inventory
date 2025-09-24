// src/pages/Dashboard.tsx
import React, { useMemo, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  BarChart3,
  Package,
  AlertTriangle,
  Activity,
  Clock,
  CheckCircle,
  ArrowUpRight,
  ArrowDownLeft,
  Package2,
  Calendar,
  Plus,
  Building2,
  PackagePlus,
  Upload,
  TrendingUp,
  Zap,
} from "lucide-react";
import {
  useItemList,
  useMovementList,
  useAllStockByItems,
  useAllExpiringItems,
} from "../stores/selectors";
import { useWorkspaceStore } from "../stores/workspaceStore";
import type { Movement } from "../stores/movementsStore";
import { getActionLabels } from "../utils/workspaceLabels";

// OnboardingCard 컴포넌트 (기존 유지 + 새 라우트 연결)
const OnboardingCard: React.FC<{
  totalItems: number;
  hasMovement: boolean;
  alertsEnabled: boolean;
  onAddItem: () => void;
  onRecordMovement: () => void;
  onEnableAlerts: () => void;
}> = React.memo(
  ({
    totalItems,
    hasMovement,
    alertsEnabled,
    onAddItem,
    onRecordMovement,
    onEnableAlerts,
  }) => {
    const step1Status = totalItems > 0 ? "completed" : "active";
    const step2Status =
      step1Status === "completed"
        ? hasMovement
          ? "completed"
          : "active"
        : "locked";
    const step3Status =
      step2Status === "completed"
        ? alertsEnabled
          ? "completed"
          : "active"
        : "locked";

    const allCompleted =
      step1Status === "completed" &&
      step2Status === "completed" &&
      step3Status === "completed";

    if (allCompleted) {
      return (
        <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl border border-green-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <h3 className="text-lg font-semibold text-green-900">
              설정 완료! 🎉
            </h3>
          </div>
          <p className="text-green-700 mb-4">
            재고 관리 시스템이 준비되었습니다. 이제 효율적인 재고 관리를
            시작하세요!
          </p>
          <div className="flex flex-wrap gap-2">
            <Link
              to="/inventory"
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
            >
              <Package className="w-4 h-4" />
              재고 관리
            </Link>
            <Link
              to="/analytics"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white text-green-700 border border-green-300 rounded-lg hover:bg-green-50 text-sm"
            >
              <BarChart3 className="w-4 h-4" />
              분석 보기
            </Link>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">시작하기</h3>
          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
            단계별 가이드
          </span>
        </div>

        <div className="space-y-3">
          {/* Step 1: 상품 추가 */}
          <div
            className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
              step1Status === "active"
                ? "border-blue-200 bg-blue-50 ring-2 ring-blue-100"
                : step1Status === "completed"
                ? "border-green-200 bg-green-50"
                : "border-gray-200 bg-gray-50 opacity-50"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  step1Status === "completed"
                    ? "bg-green-100 text-green-700"
                    : step1Status === "active"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {step1Status === "completed" ? "✓" : "1"}
              </div>
              <div>
                <p className="font-medium text-gray-900">상품 추가</p>
                <p className="text-sm text-gray-600">
                  첫 번째 상품을 등록해보세요
                </p>
              </div>
            </div>
            {step1Status === "active" && (
              <button
                onClick={onAddItem}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              >
                <Plus className="w-4 h-4" />
                진행하기
              </button>
            )}
            {step1Status === "completed" && (
              <CheckCircle className="w-5 h-5 text-green-600" />
            )}
          </div>

          {/* Step 2: 재고 관리 */}
          <div
            className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
              step2Status === "active"
                ? "border-blue-200 bg-blue-50 ring-2 ring-blue-100"
                : step2Status === "completed"
                ? "border-green-200 bg-green-50"
                : "border-gray-200 bg-gray-50 opacity-50"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  step2Status === "completed"
                    ? "bg-green-100 text-green-700"
                    : step2Status === "active"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {step2Status === "completed" ? "✓" : "2"}
              </div>
              <div>
                <p className="font-medium text-gray-900">재고 관리</p>
                <p className="text-sm text-gray-600">
                  입출고 내역을 기록하세요
                </p>
              </div>
            </div>
            {step2Status === "active" && (
              <button
                onClick={onRecordMovement}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              >
                <Activity className="w-4 h-4" />
                진행하기
              </button>
            )}
            {step2Status === "completed" && (
              <CheckCircle className="w-5 h-5 text-green-600" />
            )}
          </div>

          {/* Step 3: 분석 및 알림 */}
          <div
            className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
              step3Status === "active"
                ? "border-blue-200 bg-blue-50 ring-2 ring-blue-100"
                : step3Status === "completed"
                ? "border-green-200 bg-green-50"
                : "border-gray-200 bg-gray-50 opacity-50"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  step3Status === "completed"
                    ? "bg-green-100 text-green-700"
                    : step3Status === "active"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {step3Status === "completed" ? "✓" : "3"}
              </div>
              <div>
                <p className="font-medium text-gray-900">분석 및 알림</p>
                <p className="text-sm text-gray-600">
                  재고 상태를 모니터링하세요
                </p>
              </div>
            </div>
            {step3Status === "active" && (
              <button
                onClick={onEnableAlerts}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              >
                <TrendingUp className="w-4 h-4" />
                진행하기
              </button>
            )}
            {step3Status === "completed" && (
              <CheckCircle className="w-5 h-5 text-green-600" />
            )}
          </div>
        </div>
      </div>
    );
  }
);

// 팁 카드 (새로운 기능 포함)
const TipsCard: React.FC<{ onBulkImport: () => void }> = React.memo(
  ({ onBulkImport }) => {
    return (
      <div className="bg-gradient-to-br from-indigo-50 to-purple-100 rounded-xl border border-indigo-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-5 h-5 text-indigo-600" />
          <h3 className="font-semibold text-indigo-900">💡 팁과 도움말</h3>
        </div>
        <div className="space-y-3 mb-4">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-indigo-500 mt-2 flex-shrink-0"></div>
            <p className="text-sm text-indigo-800">
              바코드 스캔으로 빠르게 상품을 등록할 수 있어요
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-indigo-500 mt-2 flex-shrink-0"></div>
            <p className="text-sm text-indigo-800">
              최소 재고량 설정으로 자동 알림을 받으세요
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-indigo-500 mt-2 flex-shrink-0"></div>
            <p className="text-sm text-indigo-800">
              대량 업로드로 한 번에 여러 상품을 등록하세요
            </p>
          </div>
        </div>
        <button
          onClick={onBulkImport}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"
        >
          <Upload className="w-4 h-4" />
          일괄 업로드 시작
        </button>
      </div>
    );
  }
);

// 로딩 컴포넌트 (기존 유지)
const DashboardSkeleton = () => (
  <div className="p-6 lg:p-8 max-w-7xl mx-auto animate-pulse">
    <div className="mb-8">
      <div className="h-8 bg-gray-300 rounded w-1/3 mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white rounded-xl p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded w-20"></div>
              <div className="h-8 bg-gray-300 rounded w-16"></div>
              <div className="h-3 bg-gray-200 rounded w-24"></div>
            </div>
            <div className="h-12 w-12 bg-gray-200 rounded-xl"></div>
          </div>
        </div>
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-6">
        <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-lg"></div>
          ))}
        </div>
      </div>
      <div className="space-y-6">
        {[...Array(2)].map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-xl border border-gray-100 p-6"
          >
            <div className="h-6 bg-gray-200 rounded w-24 mb-4"></div>
            <div className="space-y-3">
              {[...Array(3)].map((_, j) => (
                <div key={j} className="h-12 bg-gray-100 rounded-lg"></div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// 빈 상태 컴포넌트 (새 라우트 연결)
const EmptyState: React.FC<{ currentWorkspace: any; onAddItem: () => void }> =
  React.memo(({ currentWorkspace, onAddItem }) => (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <Building2 className="w-6 h-6 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">
            {currentWorkspace?.name || "워크스페이스"} 대시보드
          </h1>
        </div>
        <p className="text-gray-600">
          새로운 워크스페이스에서 재고 관리를 시작해보세요!
        </p>
      </div>

      {/* 환영 메시지 */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl border border-blue-200 p-8 mb-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            환영합니다! 🎉
          </h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            이 워크스페이스에는 아직 등록된 상품이 없습니다. 첫 번째 상품을
            추가하여 재고 관리를 시작해보세요.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <button
              onClick={onAddItem}
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm hover:shadow-md"
            >
              <PackagePlus className="w-5 h-5 mr-2" />첫 상품 추가하기
            </button>
            <Link
              to="/inventory/bulk"
              className="inline-flex items-center px-6 py-3 bg-white text-blue-600 border border-blue-300 font-medium rounded-lg hover:bg-blue-50 transition-colors"
            >
              <Upload className="w-5 h-5 mr-2" />
              일괄 업로드
            </Link>
          </div>
        </div>
      </div>

      {/* 빈 상태 통계 카드 (기존 유지) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">
                전체 상품
              </p>
              <p className="text-3xl font-bold text-gray-900">0</p>
              <p className="text-xs text-gray-600 mt-2">상품을 추가해주세요</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-xl">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">
                재고 부족
              </p>
              <p className="text-3xl font-bold text-gray-400">0</p>
              <p className="text-xs text-gray-600 mt-2">
                모든 재고가 안전합니다
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-xl">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">
                최근 움직임
              </p>
              <p className="text-3xl font-bold text-gray-400">0</p>
              <p className="text-xs text-gray-600 mt-2">활동 내역이 없습니다</p>
            </div>
            <div className="p-3 bg-gray-100 rounded-xl">
              <Activity className="w-6 h-6 text-gray-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">총 재고</p>
              <p className="text-3xl font-bold text-gray-400">0</p>
              <p className="text-xs text-gray-600 mt-2">재고를 관리해보세요</p>
            </div>
            <div className="p-3 bg-gray-100 rounded-xl">
              <Package2 className="w-6 h-6 text-gray-600" />
            </div>
          </div>
        </div>
      </div>

      {/* 시작 가이드 + 팁 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <OnboardingCard
          totalItems={0}
          hasMovement={false}
          alertsEnabled={false}
          onAddItem={onAddItem}
          onRecordMovement={() => {}} // 비활성화됨
          onEnableAlerts={() => {}} // 비활성화됨
        />
        <TipsCard
          onBulkImport={() => (window.location.href = "/inventory/bulk")}
        />
      </div>
    </div>
  ));

export default function Dashboard() {
  const navigate = useNavigate();

  // 워크스페이스 관련
  const {
    currentWorkspaceId,
    getCurrentWorkspace,
    ensureDefaultWorkspace,
    isInitialized,
  } = useWorkspaceStore();

  const currentWorkspace = getCurrentWorkspace();

  // 워크스페이스 초기화
  useEffect(() => {
    if (isInitialized && currentWorkspaceId) return;
    if (!isInitialized) {
      ensureDefaultWorkspace();
    }
  }, [isInitialized, currentWorkspaceId, ensureDefaultWorkspace]);

  // 데이터 훅들
  const items = useItemList();
  const movements = useMovementList();
  const allStockByItems = useAllStockByItems();
  const expiringItemsSet = useAllExpiringItems(30);

  // 온보딩 액션 핸들러들 (새 라우트 연결)
  const handleAddItem = useCallback(
    () => navigate("/inventory/new"),
    [navigate]
  );
  const handleRecordMovement = useCallback(
    () => navigate("/movements/new"),
    [navigate]
  );
  const handleEnableAlerts = useCallback(
    () => navigate("/settings/alerts"),
    [navigate]
  );
  const handleBulkImport = useCallback(
    () => navigate("/inventory/bulk"),
    [navigate]
  );

  // 통계 계산 (기존 로직 유지)
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

    let stockByItemsArray = [];
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

    const lowStockItems = stockByItemsArray.filter((item: any) => {
      const currentStock = item.stock || 0;
      const minStock = item.minStock || 5;
      return currentStock <= minStock;
    }).length;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentMovements = movements.filter((m: Movement) => {
      const movementDate = new Date(m.createdAt);
      return movementDate >= sevenDaysAgo;
    }).length;

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

  // 최근 활동 내역
  const recentActivity = useMemo(() => {
    if (!movements || !Array.isArray(movements)) {
      console.log("recentActivity: movements가 배열이 아님", typeof movements);
      return [];
    }

    try {
      const sorted = [...movements]
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        .slice(0, 8);

      // 안전한 타입 변환
      const enriched = sorted.map((m: any) => ({
        ...m,
        itemName: m.itemName || "삭제된 품목",
        isItemDeleted: m.isItemDeleted || false,
      }));

      console.log("recentActivity 결과:", enriched.length);
      return enriched;
    } catch (error) {
      console.error("recentActivity 처리 중 오류:", error);
      return [];
    }
  }, [movements]);

  // 유통기한 임박 품목
  const expiringItems = useMemo(() => {
    if (!expiringItemsSet || !items) return [];

    let expiringIds: string[] = [];

    try {
      // Set인 경우
      if (expiringItemsSet instanceof Set) {
        expiringIds = Array.from(expiringItemsSet);
      }
      // 배열인 경우 - 타입 단언으로 안전하게 처리
      else if (Array.isArray(expiringItemsSet)) {
        expiringIds = (expiringItemsSet as Array<{ id: string }>).map(
          (item) => item.id
        );
      }
      // 객체 배열이 아닌 경우 처리
      else if (
        typeof expiringItemsSet === "object" &&
        expiringItemsSet !== null
      ) {
        // 객체를 배열로 변환 시도
        const entries = Object.entries(expiringItemsSet);
        if (entries.length > 0) {
          expiringIds = entries.map(([key]) => key);
        }
      } else {
        console.warn(
          "expiringItemsSet 타입을 인식할 수 없습니다:",
          typeof expiringItemsSet
        );
        return [];
      }
    } catch (error) {
      console.error("expiringItems 처리 중 오류:", error);
      return [];
    }

    // items가 배열인지 확인 후 필터링
    if (!Array.isArray(items)) {
      console.warn("items가 배열이 아닙니다:", typeof items);
      return [];
    }

    return items
      .filter((item: any) => item && item.id && expiringIds.includes(item.id))
      .slice(0, 5);
  }, [expiringItemsSet, items]);

  // 재고 부족 품목
  const lowStockItems = useMemo(() => {
    if (!items || !Array.isArray(items)) {
      console.log("lowStockItems: items가 배열이 아님", typeof items);
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
      console.error("lowStockItems 처리 중 오류:", error);
      return [];
    }
  }, [items, allStockByItems]);

  // 헬퍼 함수들 (기존 유지)
  const getMovementIcon = (type: string) => {
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

  const getMovementColor = (type: string) => {
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

  const getMovementLabel = (type: string) => {
    if (!currentWorkspace) {
      switch (type) {
        case "IN":
          return "입고";
        case "OUT":
          return "출고";
        case "USE":
          return "사용";
        case "ADJUST":
          return "조정";
        case "TRANSFER":
          return "이동";
        default:
          return type;
      }
    }

    const labels = getActionLabels(currentWorkspace.type || "DEFAULT");
    return labels[type as keyof typeof labels] || type;
  };

  // 로딩 상태
  if (!isInitialized) {
    return <DashboardSkeleton />;
  }

  // 워크스페이스 없음
  if (!currentWorkspace) {
    return (
      <div className="p-6 text-center">
        <div className="max-w-md mx-auto">
          <div className="mb-4">
            <Building2 className="mx-auto h-12 w-12 text-gray-400" />
          </div>
          <h2 className="text-lg font-medium text-gray-900 mb-2">
            워크스페이스가 없습니다
          </h2>
          <p className="text-gray-600 mb-6">
            재고 관리를 시작하려면 먼저 워크스페이스를 생성하세요.
          </p>
          <button
            onClick={() => ensureDefaultWorkspace()}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            + 첫 워크스페이스 만들기
          </button>
        </div>
      </div>
    );
  }

  // 빈 상태
  if (stats.totalItems === 0) {
    return (
      <EmptyState
        currentWorkspace={currentWorkspace}
        onAddItem={handleAddItem}
      />
    );
  }

  // 메인 대시보드 렌더링
  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      {/* 헤더 */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Building2 className="w-6 h-6 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {currentWorkspace?.name || "워크스페이스"} 대시보드
              </h1>
              <p className="text-gray-600">재고 현황을 한눈에 확인하세요</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={handleAddItem}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <PackagePlus className="w-4 h-4" />
              상품 추가
            </button>
            <button
              onClick={handleBulkImport}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              <Upload className="w-4 h-4" />
              일괄 업로드
            </button>
          </div>
        </div>
      </div>

      {/* 통계 카드 (개선된 디자인) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">
                전체 상품
              </p>
              <p className="text-3xl font-bold text-gray-900">
                {stats.totalItems}
              </p>
              <p className="text-xs text-gray-600 mt-2">등록된 상품 수</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-xl">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">
                재고 부족
              </p>
              <p
                className={`text-3xl font-bold ${
                  stats.lowStockItems > 0 ? "text-red-600" : "text-green-600"
                }`}
              >
                {stats.lowStockItems}
              </p>
              <p className="text-xs text-gray-600 mt-2">
                {stats.lowStockItems > 0 ? "주의 필요" : "모든 재고 안전"}
              </p>
            </div>
            <div
              className={`p-3 rounded-xl ${
                stats.lowStockItems > 0 ? "bg-red-100" : "bg-green-100"
              }`}
            >
              {stats.lowStockItems > 0 ? (
                <AlertTriangle className="w-6 h-6 text-red-600" />
              ) : (
                <CheckCircle className="w-6 h-6 text-green-600" />
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">
                최근 움직임
              </p>
              <p className="text-3xl font-bold text-green-600">
                {stats.recentMovements}
              </p>
              <p className="text-xs text-gray-600 mt-2">최근 7일</p>
            </div>
            <div className="p-3 bg-green-100 rounded-xl">
              <Activity className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">총 재고</p>
              <p className="text-3xl font-bold text-purple-600">
                {stats.totalStock.toLocaleString()}
              </p>
              <p className="text-xs text-gray-600 mt-2">전체 재고량</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-xl">
              <Package2 className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 그리드 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* 최근 활동 (2/3 너비) */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Activity className="w-5 h-5 mr-2 text-blue-600" />
              최근 활동
            </h3>
          </div>
          {/* 최근 활동 렌더링 부분 */}
          <div className="p-6">
            {recentActivity.length > 0 ? (
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
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
                          {activity.itemName}
                          {activity.itemName === "알 수 없는 상품" && (
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
                                : activity.type === "OUT" ||
                                  activity.type === "USE"
                                ? "bg-red-100 text-red-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {getMovementLabel(activity.type)}
                          </span>
                          {activity.reason && (
                            <span className="text-xs text-gray-500">
                              • {activity.reason}
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
                          : "±"}
                        {activity.qty}
                      </div>
                      <div className="flex items-center text-xs text-gray-400 mt-1">
                        <Clock className="w-3 h-3 mr-1" />
                        {new Date(activity.createdAt).toLocaleDateString(
                          "ko-KR",
                          {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Activity className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">최근 활동이 없습니다.</p>
                <p className="text-sm text-gray-400 mt-1">
                  상품을 추가하고 입출고를 기록해보세요.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 온보딩 + 팁 (1/3 너비) */}
        <div className="space-y-6">
          <OnboardingCard
            totalItems={stats.totalItems}
            hasMovement={stats.recentMovements > 0}
            alertsEnabled={false} // TODO: 사용자 설정에서 가져오기
            onAddItem={handleAddItem}
            onRecordMovement={handleRecordMovement}
            onEnableAlerts={handleEnableAlerts}
          />
          <TipsCard onBulkImport={handleBulkImport} />
        </div>
      </div>

      {/* 알림 패널 (저재고 + 유통기한) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* 재고 부족 품목 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-red-600" />
              재고 부족
              {lowStockItems.length > 0 && (
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  {lowStockItems.length}
                </span>
              )}
            </h3>
          </div>
          <div className="p-6">
            {lowStockItems.length > 0 ? (
              <div className="space-y-3">
                {lowStockItems.map((item: any, index) => {
                  let currentStock = 0;
                  if (allStockByItems && typeof allStockByItems === "object") {
                    currentStock = allStockByItems[item.id] || item.stock || 0;
                  } else {
                    currentStock = item.stock || 0;
                  }

                  return (
                    <div
                      key={`${item.id}-${index}`}
                      className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100 hover:bg-red-100 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="p-1 bg-red-100 rounded">
                          <Package className="w-4 h-4 text-red-600" />
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-900">
                            {item.name}
                          </span>
                          <div className="text-xs text-gray-500">
                            최소재고: {item.minStock || 5}개
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-semibold text-red-600">
                          {currentStock}개
                        </span>
                      </div>
                    </div>
                  );
                })}
                <Link
                  to="/inventory?filter=low"
                  className="block w-full text-center py-2 text-sm text-red-600 hover:text-red-800 font-medium"
                >
                  모든 부족 상품 보기 →
                </Link>
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <p className="text-sm text-gray-500">
                  재고 부족 품목이 없습니다.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 유통기한 임박 품목 */}
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
            {expiringItems.length > 0 ? (
              <div className="space-y-3">
                {expiringItems.map((item: any, index) => (
                  <div
                    key={`${item.id}-${index}`}
                    className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-100 hover:bg-orange-100 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-1 bg-orange-100 rounded">
                        <Clock className="w-4 h-4 text-orange-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {item.name}
                      </span>
                    </div>
                    <span className="inline-flex items-center px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded-full">
                      주의
                    </span>
                  </div>
                ))}
                <Link
                  to="/inventory?filter=expiring"
                  className="block w-full text-center py-2 text-sm text-orange-600 hover:text-orange-800 font-medium"
                >
                  모든 임박 상품 보기 →
                </Link>
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <p className="text-sm text-gray-500">
                  유통기한 임박 품목이 없습니다.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 요약 통계 (개선된 디자인) */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl border border-blue-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center space-x-4 mb-4 lg:mb-0">
            <div className="p-3 bg-blue-100 rounded-xl">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                재고 현황 요약
              </h3>
              <p className="text-sm text-gray-600">
                {currentWorkspace?.name || "워크스페이스"}의 전체적인 재고 상태
              </p>
            </div>
          </div>
          <div className="flex space-x-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {stats.totalItems}
              </div>
              <div className="text-xs text-gray-500">총 상품</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {stats.totalStock.toLocaleString()}
              </div>
              <div className="text-xs text-gray-500">총 재고</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {stats.recentMovements}
              </div>
              <div className="text-xs text-gray-500">최근 움직임</div>
            </div>
          </div>
        </div>
      </div>

      {/* 모바일용 빠른 액션 */}
      <div className="mt-8 bg-gray-50 rounded-xl border border-gray-200 p-4 md:hidden">
        <h3 className="font-semibold text-gray-900 mb-3">빠른 액션</h3>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleAddItem}
            className="flex items-center justify-center gap-2 py-3 bg-white rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
          >
            <PackagePlus className="w-4 h-4" />
            상품 추가
          </button>
          <button
            onClick={handleBulkImport}
            className="flex items-center justify-center gap-2 py-3 bg-white rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
          >
            <Upload className="w-4 h-4" />
            일괄 업로드
          </button>
        </div>
      </div>
    </div>
  );
}
