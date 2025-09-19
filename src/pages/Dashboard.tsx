import { useMemo } from "react";
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
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  useItemList,
  useMovementList,
  useAllStockByItems,
  useAllExpiringItems,
} from "../stores/selectors";
import { useWorkspaceInit } from "../hooks/useWorkspaceInit";
import type { Movement } from "../stores/movementsStore";

// 로딩 컴포넌트
const DashboardSkeleton = () => (
  <div className="p-6 lg:p-8 max-w-7xl mx-auto animate-pulse">
    <div className="mb-8">
      <div className="h-8 bg-gray-300 rounded w-1/3 mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white rounded-xl p-6">
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
  </div>
);

// 빈 상태 컴포넌트
const EmptyState = ({ currentWorkspace }: { currentWorkspace: any }) => (
  <div className="p-6 lg:p-8 max-w-7xl mx-auto">
    <div className="mb-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">
        {currentWorkspace?.name || "워크스페이스"} 대시보드
      </h1>
      <p className="text-gray-600">재고 관리를 시작해보세요!</p>
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
          아직 등록된 상품이 없습니다. 첫 번째 상품을 추가하여 재고 관리를
          시작해보세요.
        </p>
        <Link
          to="/inventory"
          className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
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
          <div className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
              <span className="text-sm font-bold text-blue-600">1</span>
            </div>
            <div>
              <p className="font-medium text-gray-900">상품 추가</p>
              <p className="text-sm text-gray-600">
                첫 번째 상품을 등록해보세요
              </p>
            </div>
          </div>
          <div className="flex items-center p-3 border border-gray-200 rounded-lg">
            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mr-3">
              <span className="text-sm font-bold text-gray-400">2</span>
            </div>
            <div>
              <p className="font-medium text-gray-500">재고 관리</p>
              <p className="text-sm text-gray-500">입출고 내역을 기록하세요</p>
            </div>
          </div>
          <div className="flex items-center p-3 border border-gray-200 rounded-lg">
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
          <div className="p-3 bg-green-50 rounded-lg">
            <p className="text-sm font-medium text-green-900">💡 팁</p>
            <p className="text-sm text-green-700 mt-1">
              바코드 스캔 기능을 활용하여 빠르게 상품을 등록할 수 있습니다
            </p>
          </div>
          <div className="p-3 bg-yellow-50 rounded-lg">
            <p className="text-sm font-medium text-yellow-900">⚡ 효율성</p>
            <p className="text-sm text-yellow-700 mt-1">
              최소 재고량을 설정하여 부족한 재고를 자동으로 알림받으세요
            </p>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-sm font-medium text-blue-900">📊 분석</p>
            <p className="text-sm text-blue-700 mt-1">
              이동 내역을 통해 재고 흐름을 파악할 수 있습니다
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default function Dashboard() {
  const { isLoading, isReady, currentWorkspace } = useWorkspaceInit();
  const items = useItemList();
  const movements = useMovementList();
  const allStockByItems = useAllStockByItems();
  const expiringItemsSet = useAllExpiringItems(30);

  // 기존 Dashboard 로직 (데이터가 있을 때)
  const stats = useMemo(() => {
    const totalItems = items.length;
    const lowStockItems = items.filter(
      (item: any) => (allStockByItems[item.id] || 0) <= (item.minStock || 5)
    ).length;
    const recentMovements = movements.filter(
      (m: Movement) =>
        Date.now() - new Date(m.createdAt).getTime() < 7 * 24 * 60 * 60 * 1000
    ).length;
    const totalStock = Object.values(allStockByItems).reduce(
      (sum, stock) => sum + stock,
      0
    );

    return { totalItems, lowStockItems, recentMovements, totalStock };
  }, [items, movements, allStockByItems]);

  const recentActivity = useMemo(() => {
    return movements.slice(0, 8).map((m: Movement) => {
      const item = items.find((i: any) => i.id === m.itemId);
      return {
        ...m,
        itemName: item?.name || "Unknown Item",
      };
    });
  }, [movements, items]);

  const expiringItems = useMemo(() => {
    return items
      .filter((item: any) => expiringItemsSet.has(item.id))
      .slice(0, 5);
  }, [items, expiringItemsSet]);

  const lowStockItems = useMemo(() => {
    return items
      .filter(
        (item: any) => (allStockByItems[item.id] || 0) <= (item.minStock || 5)
      )
      .slice(0, 5);
  }, [items, allStockByItems]);

  // 로딩 중일 때
  if (isLoading) {
    return <DashboardSkeleton />;
  }

  // 워크스페이스가 준비되지 않았을 때
  if (!isReady) {
    return (
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            워크스페이스 설정 중
          </h2>
          <p className="text-gray-600">잠시만 기다려주세요...</p>
        </div>
      </div>
    );
  }

  // 데이터가 없을 때 (빈 상태)
  if (items.length === 0) {
    return <EmptyState currentWorkspace={currentWorkspace} />;
  }

  if (!items || !movements) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  const getMovementIcon = (type: string) => {
    switch (type) {
      case "IN":
        return <ArrowUpRight className="w-4 h-4" />;
      case "OUT":
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
        return "text-red-600 bg-red-50";
      case "ADJUST":
        return "text-blue-600 bg-blue-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const getMovementLabel = (type: string) => {
    switch (type) {
      case "IN":
        return "입고";
      case "OUT":
        return "출고";
      case "ADJUST":
        return "조정";
      case "TRANSFER":
        return "이동";
      case "USE":
        return "사용";
      default:
        return type;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {currentWorkspace?.name || "워크스페이스"} 대시보드
          </h1>
          <p className="text-gray-600">재고 현황을 한눈에 확인하세요</p>
        </div>

        {/* 로딩 스켈레톤 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center text-gray-500 mt-8">
          데이터를 불러오는 중...
        </div>
      </div>
    );
  }
  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">대시보드</h1>
        <p className="text-gray-600">재고 현황을 한눈에 확인하세요</p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
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

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">
                재고 부족
              </p>
              <p className="text-3xl font-bold text-red-600">
                {stats.lowStockItems}
              </p>
              <p className="text-xs text-gray-600 mt-2">주의 필요</p>
            </div>
            <div className="p-3 bg-red-100 rounded-xl">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
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

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">총 재고</p>
              <p className="text-3xl font-bold text-purple-600">
                {stats.totalStock}
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
                    key={index}
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
                                : activity.type === "OUT"
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
                            : activity.type === "OUT"
                            ? "text-red-600"
                            : "text-blue-600"
                        }`}
                      >
                        {activity.type === "IN"
                          ? "+"
                          : activity.type === "OUT"
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
              </h3>
            </div>
            <div className="p-6">
              {lowStockItems.length > 0 ? (
                <div className="space-y-3">
                  {lowStockItems.map((item: any, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-red-50 rounded-lg"
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
                          {allStockByItems[item.id] || 0}개
                        </span>
                      </div>
                    </div>
                  ))}
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
              </h3>
            </div>
            <div className="p-6">
              {expiringItems.length > 0 ? (
                <div className="space-y-3">
                  {expiringItems.map((item: any, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-orange-50 rounded-lg"
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
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-100 rounded-xl">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                재고 현황 요약
              </h3>
              <p className="text-sm text-gray-600">
                전체적인 재고 상태를 확인하세요
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
                {stats.totalStock}
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
