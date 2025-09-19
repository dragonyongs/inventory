// src/pages/Dashboard.tsx
import { useMemo } from "react";
import { useMovementList, useItemsMap } from "../stores/selectors";
import { useLotsStore } from "../stores/lotsStore";
import { useItemsStore } from "../stores/itemsStore";
import { useSettingsStore } from "../stores/settingsStore";

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="bg-white p-4 rounded border">
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm text-gray-600">{label}</div>
    </div>
  );
}

export default function Dashboard() {
  const movements = useMovementList();
  const itemsMap = useItemsMap();
  const lots = useLotsStore((s) => s.lots ?? {});
  const items = useItemsStore((s) => s.items ?? {});
  const expiringDays = useSettingsStore((s) => s.expiringDays ?? 30);

  const stats = useMemo(() => {
    const totalItems = Object.keys(items).length;
    const totalStock = Object.values(lots).reduce(
      (sum: number, lot: any) => sum + (lot.qty ?? 0),
      0
    );

    // 만료 임박 계산 (정규화된 날짜 사용)
    const expiringSoon = Object.values(lots).filter((lot: any) => {
      const exp = lot.expiresAt ?? lot.expires_at;
      if (!exp) return false;
      const diffDays = (new Date(exp).getTime() - Date.now()) / 86400000;
      return diffDays <= expiringDays && diffDays > 0;
    }).length;

    return { totalItems, totalStock, expiringSoon };
  }, [items, lots, expiringDays]);

  // 최근 이동 기록 (정규화된 movements 사용)
  const recentMovements = useMemo(
    () =>
      movements
        .toSorted(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        .slice(0, 10),
    [movements]
  );

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Stat label="Total Items" value={stats.totalItems} />
        <Stat label="Total Stock" value={stats.totalStock} />
        <Stat label="Expiring Soon" value={stats.expiringSoon} />
      </div>

      {/* Recent Movements */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Movements</h2>
        {recentMovements.length === 0 ? (
          <p className="text-gray-500">No recent movements</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Date</th>
                  <th className="text-left p-2">Type</th>
                  <th className="text-left p-2">Item</th>
                  <th className="text-left p-2">Qty</th>
                </tr>
              </thead>
              <tbody>
                {recentMovements.map((m) => (
                  <tr key={m.id} className="border-b">
                    <td className="p-2">
                      {new Date(m.createdAt).toLocaleString()}
                    </td>
                    <td className="p-2">{m.type}</td>
                    <td className="p-2">
                      {itemsMap[m.itemId]?.name ?? m.itemId}
                    </td>
                    <td className="p-2">{m.qty}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
