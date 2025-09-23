// src/pages/Dashboard.tsx
import React, { useMemo, useEffect } from "react";
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
  ArrowRight,
  Building2,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  useItemList,
  useMovementList,
  useAllStockByItems,
  useAllExpiringItems,
} from "../stores/selectors";
// ⛔ 중복 생성 원인 제거
// import { useWorkspaceInit } from "../hooks/useWorkspaceInit";
// import { useWorkspaceSync } from "../hooks/useWorkspaceSync";
import { useWorkspaceStore } from "../stores/workspaceStore";
import type { Movement } from "../stores/movementsStore";
import {
  getActionLabels,
  getActionDescription,
} from "../utils/workspaceLabels";

// 로딩 컴포넌트
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

// 빈 상태 컴포넌트
const EmptyState = ({ currentWorkspace }: { currentWorkspace: any }) => (
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
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 p-8 mb-8">
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
        <Link
          to="/inventory"
          className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm hover:shadow-md"
        >
          <Plus className="w-5 h-5 mr-2" />
          첫 상품 추가하기
          <ArrowRight className="w-5 h-5 ml-2" />
        </Link>
      </div>
    </div>

    {/* 빈 상태 통계 카드 */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">전체 상품</p>
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
            <p className="text-sm font-medium text-gray-500 mb-1">재고 부족</p>
            <p className="text-3xl font-bold text-gray-400">0</p>
            <p className="text-xs text-gray-600 mt-2">모든 재고가 안전합니다</p>
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

    {/* 시작 가이드 */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Package className="w-5 h-5 mr-2 text-blue-600" />
          시작하기
        </h3>
        <div className="space-y-4">
          <Link
            to="/inventory"
            className="flex items-center p-4 border-2 border-blue-200 rounded-lg hover:bg-blue-50 transition-colors group"
          >
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3 group-hover:bg-blue-200">
              <span className="text-sm font-bold text-blue-600">1</span>
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900 group-hover:text-blue-900">
                상품 추가
              </p>
              <p className="text-sm text-gray-600 group-hover:text-blue-700">
                첫 번째 상품을 등록해보세요
              </p>
            </div>
            <ArrowRight className="w-5 h-5 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>

          <div className="flex items-center p-4 border border-gray-200 rounded-lg opacity-50">
            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mr-3">
              <span className="text-sm font-bold text-gray-400">2</span>
            </div>
            <div>
              <p className="font-medium text-gray-500">재고 관리</p>
              <p className="text-sm text-gray-500">입출고 내역을 기록하세요</p>
            </div>
          </div>

          <div className="flex items-center p-4 border border-gray-200 rounded-lg opacity-50">
            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mr-3">
              <span className="text-sm font-bold text-gray-400">3</span>
            </div>
            <div>
              <p className="font-medium text-gray-500">분석 및 알림</p>
              <p className="text-sm text-gray-500">
                재고 상태를 모니터링하세요
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Calendar className="w-5 h-5 mr-2 text-green-600" />
          팁과 도움말
        </h3>
        <div className="space-y-3">
          <div className="p-3 bg-green-50 rounded-lg border border-green-100">
            <p className="text-sm font-medium text-green-900 mb-1">
              💡 빠른 등록
            </p>
            <p className="text-sm text-green-700">
              바코드 스캔 기능을 활용하여 빠르게 상품을 등록할 수 있습니다
            </p>
          </div>
          <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-100">
            <p className="text-sm font-medium text-yellow-900 mb-1">
              ⚡ 스마트 알림
            </p>
            <p className="text-sm text-yellow-700">
              최소 재고량을 설정하여 부족한 재고를 자동으로 알림받으세요
            </p>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
            <p className="text-sm font-medium text-blue-900 mb-1">
              📊 데이터 분석
            </p>
            <p className="text-sm text-blue-700">
              이동 내역을 통해 재고 흐름을 파악할 수 있습니다
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default function Dashboard() {
  // ✅ 워크스페이스 초기화 로직 변경 - 중복 생성 방지
  const {
    currentWorkspaceId,
    getCurrentWorkspace,
    ensureDefaultWorkspace,
    isInitialized,
  } = useWorkspaceStore();

  const currentWorkspace = getCurrentWorkspace();

  // ✅ 워크스페이스 초기화 - 단순화
  useEffect(() => {
    console.log("Dashboard useEffect:", { isInitialized, currentWorkspaceId });

    // 이미 초기화되어있고 현재 워크스페이스가 있으면 추가 처리 안함
    if (isInitialized && currentWorkspaceId) {
      console.log("✅ Dashboard: 워크스페이스 이미 준비됨");
      return;
    }

    // 초기화되지 않았을 때만 처리
    if (!isInitialized) {
      console.log("🎯 Dashboard: 워크스페이스 초기화 필요");
      ensureDefaultWorkspace();
    }
  }, [isInitialized, currentWorkspaceId, ensureDefaultWorkspace]);

  // 🔧 데이터 훅들
  const items = useItemList();
  const movements = useMovementList();
  const allStockByItems = useAllStockByItems();
  const expiringItemsSet = useAllExpiringItems(30);

  // 🔧 디버깅 로그 추가
  console.log("=== Dashboard 렌더링 정보 ===");
  console.log("currentWorkspaceId:", currentWorkspaceId);
  console.log("currentWorkspace:", currentWorkspace?.name);
  console.log("items:", items?.length || 0, "개");
  console.log("movements:", movements?.length || 0, "개");
  console.log(
    "allStockByItems:",
    typeof allStockByItems,
    Object.keys(allStockByItems || {}).length,
    "개"
  );
  console.log("expiringItemsSet:", expiringItemsSet?.size || 0, "개");
  console.log("isInitialized:", isInitialized);

  // ✅ 통계 계산 - reduce 에러 수정
  const stats = useMemo(() => {
    if (!items || !movements) {
      console.log("통계 계산 건너뛰기: 데이터 없음");
      return {
        totalItems: 0,
        lowStockItems: 0,
        recentMovements: 0,
        totalStock: 0,
      };
    }

    const totalItems = items.length;

    // ✅ stockByItems 배열/객체 처리 수정
    let stockByItemsArray = [];
    if (Array.isArray(allStockByItems)) {
      stockByItemsArray = allStockByItems;
    } else if (allStockByItems && typeof allStockByItems === "object") {
      // 객체인 경우 값들을 배열로 변환하여 처리
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

    // ✅ totalStock 계산 수정
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

    const calculatedStats = {
      totalItems,
      lowStockItems,
      recentMovements,
      totalStock,
    };
    console.log("통계 계산 결과:", calculatedStats);
    return calculatedStats;
  }, [items, movements, allStockByItems]);

  // 최근 활동 내역 (정렬 수정)
  const recentActivity = useMemo(() => {
    if (!movements || !items) {
      console.log("recentActivity 계산 건너뛰기: 데이터 없음");
      return [];
    }

    // 🔧 최신순으로 정렬 후 8개 선택
    const sorted = [...movements]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, 8);

    const enriched = sorted.map((m: Movement) => {
      const item = items.find((i: any) => i.id === m.itemId);
      return {
        ...m,
        itemName: item?.name || "알 수 없는 상품",
      };
    });

    console.log("recentActivity 계산 결과:", enriched.length, "개");
    return enriched;
  }, [movements, items]);

  // 유통기한 임박 품목 (Set 처리 수정)
  const expiringItems = useMemo(() => {
    if (!expiringItemsSet || !items) {
      console.log("expiringItems 계산 건너뛰기: 데이터 없음");
      return [];
    }

    // 🔧 Set을 Array로 변환하여 처리
    let expiringIds: string[] = [];
    if (expiringItemsSet instanceof Set) {
      expiringIds = Array.from(expiringItemsSet);
    } else if (Array.isArray(expiringItemsSet)) {
      expiringIds = expiringItemsSet.map((item: any) => item.id);
    } else {
      console.log(
        "expiringItemsSet 타입이 예상과 다름:",
        typeof expiringItemsSet
      );
      return [];
    }

    const expiring = items
      .filter((item: any) => expiringIds.includes(item.id))
      .slice(0, 5);
    console.log("expiringItems 계산 결과:", expiring.length, "개");
    return expiring;
  }, [expiringItemsSet, items]);

  // 재고 부족 품목
  const lowStockItems = useMemo(() => {
    if (!items) {
      console.log("lowStockItems 계산 건너뛰기: 데이터 없음");
      return [];
    }

    const lowItems = items
      .filter((item: any) => {
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

    console.log("lowStockItems 계산 결과:", lowItems.length, "개");
    return lowItems;
  }, [items, allStockByItems]);

  // 🔧 로딩 상태 체크 개선
  if (!isInitialized) {
    console.log("Dashboard: 초기화 대기중");
    return <DashboardSkeleton />;
  }

  // 🔧 워크스페이스가 없을 때 처리
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
            onClick={() => {
              // 워크스페이스 생성 모달 열기 또는 생성 페이지로 이동
              console.log("워크스페이스 생성 버튼 클릭");
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            + 첫 워크스페이스 만들기
          </button>
        </div>
      </div>
    );
  }

  console.log("Dashboard: 렌더링", {
    workspaceName: currentWorkspace.name,
    itemsCount: items?.length || 0,
  });

  // 도우미 함수들
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
      // 기본값
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

  // 데이터가 없을 때 (빈 상태)
  if (stats.totalItems === 0) {
    return <EmptyState currentWorkspace={currentWorkspace} />;
  }

  // 메인 대시보드 렌더링
  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      {/* 🔧 개발 모드에서 디버깅 정보 표시 */}
      {import.meta.env.DEV && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm">
          <strong>디버그 정보:</strong>
          <br />
          워크스페이스: {currentWorkspaceId} ({currentWorkspace?.name})<br />
          아이템: {items?.length || 0}개 | 이동: {movements?.length || 0}개
          <br />
          통계: 총재고 {stats.totalStock}, 부족 {stats.lowStockItems}개,
          최근움직임 {stats.recentMovements}개
        </div>
      )}

      {/* 헤더 */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-2">
          <Building2 className="w-6 h-6 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">
            {currentWorkspace?.name || "워크스페이스"} 대시보드
          </h1>
        </div>
        <p className="text-gray-600">재고 현황을 한눈에 확인하세요</p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
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

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
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

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
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

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 최근 활동 */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Activity className="w-5 h-5 mr-2 text-blue-600" />
              최근 활동
            </h3>
          </div>
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
                        <p className="font-medium text-gray-900">
                          {activity.itemName}
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

        {/* 알림 패널 */}
        <div className="space-y-6">
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
                    if (
                      allStockByItems &&
                      typeof allStockByItems === "object"
                    ) {
                      currentStock =
                        allStockByItems[item.id] || item.stock || 0;
                    } else {
                      currentStock = item.stock || 0;
                    }

                    return (
                      <div
                        key={`${item.id}-${index}`}
                        className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100"
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
                      className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-100"
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
      </div>

      {/* 요약 통계 */}
      <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 p-6">
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
    </div>
  );
}
