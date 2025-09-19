// src/pages/Dashboard.tsx
import { useMemo } from "react";
import {
  useItemList,
  useMovementList,
  useStockByItem,
  useExpiringSoonByItem,
} from "../stores/selectors";
import { useLotsStore } from "../stores/lotsStore";

export default function Dashboard() {
  const items = useItemList();
  const movements = useMovementList();
  const lots = useLotsStore((s: any) => s.lots);

  // 통계 계산
  const stats = useMemo(() => {
    const totalItems = items.length;
    const lowStockItems = items.filter(
      (item: any) => useStockByItem(item.id) <= (item.minStock || 5)
    ).length;
    const recentMovements = movements.filter(
      (m) =>
        Date.now() - new Date(m.createdAt).getTime() < 7 * 24 * 60 * 60 * 1000
    ).length;
    const totalLots = Object.keys(lots).length;

    return {
      totalItems,
      lowStockItems,
      recentMovements,
      totalLots,
    };
  }, [items, movements, lots]);

  // 최근 입고/출고 요약
  const recentActivity = useMemo(() => {
    return movements.slice(0, 5).map((m) => {
      const item = items.find((i: any) => i.id === m.itemId);
      return {
        ...m,
        itemName: item?.name || "Unknown Item",
        value: m.qty as string | number,
      };
    });
  }, [movements, items]);

  // 만료 임박 품목
  const expiringItems = useMemo(() => {
    return items
      .filter((item: any) => useExpiringSoonByItem(item.id, 30))
      .slice(0, 5);
  }, [items]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">대시보드</h1>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-blue-800">총 품목 수</h3>
          <p className="text-2xl font-bold text-blue-900">{stats.totalItems}</p>
        </div>
        <div className="bg-red-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-red-800">재고 부족</h3>
          <p className="text-2xl font-bold text-red-900">
            {stats.lowStockItems}
          </p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-green-800">
            최근 7일 움직임
          </h3>
          <p className="text-2xl font-bold text-green-900">
            {stats.recentMovements}
          </p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-purple-800">로트 수</h3>
          <p className="text-2xl font-bold text-purple-900">
            {stats.totalLots}
          </p>
        </div>
      </div>

      {/* 최근 활동 */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">최근 활동</h2>
        {recentActivity.length > 0 ? (
          <div className="space-y-3">
            {recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="flex justify-between items-center border-b pb-2"
              >
                <div>
                  <span className="font-medium">{activity.itemName}</span>
                  <span className="text-sm text-gray-500 ml-2">
                    {activity.type === "IN"
                      ? "입고"
                      : activity.type === "OUT"
                      ? "출고"
                      : "조정"}
                  </span>
                </div>
                <div className="text-right">
                  <div
                    className={`font-semibold ${
                      activity.type === "IN" ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {activity.type === "IN" ? "+" : "-"}
                    {activity.value}
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(activity.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">최근 활동이 없습니다.</p>
        )}
      </div>

      {/* 만료 임박 품목 */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">유통기한 임박</h2>
        {expiringItems.length > 0 ? (
          <div className="space-y-2">
            {expiringItems.map((item: any) => (
              <div key={item.id} className="flex justify-between items-center">
                <span>{item.name}</span>
                <span className="text-orange-600 text-sm">주의</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">유통기한 임박 품목이 없습니다.</p>
        )}
      </div>
    </div>
  );
}
