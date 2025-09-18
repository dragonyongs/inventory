// src/pages/Dashboard.tsx (추가)
import { useMemo } from "react";
import { useItemList, useMovementList } from "../stores/selectors";
import { useSettingsStore } from "../stores/settingsStore";
import { useLotsStore } from "../stores/lotsStore";

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="border rounded p-3">
      <div className="text-sm text-gray-600">{label}</div>
      <div className="text-2xl">{value}</div>
    </div>
  );
}

export function Component() {
  const items = useItemList(); // 얕은 비교 셀렉터 [web:13][web:16]
  const movements = useMovementList(); // 얕은 비교 셀렉터 [web:13][web:16]
  const expiringDays = useSettingsStore((s) => s.expiringDays);
  const lotsMap = useLotsStore((s) => s.lots); // lots는 지도 형태로만 구독

  const { lowStock, expiringSoon } = useMemo(() => {
    let low = 0;
    let exp = 0;
    for (const it of items) {
      const lots = Object.values(lotsMap).filter((l) => l.itemId === it.id);
      const stock = lots.reduce((a, b) => a + b.qty, 0);
      if (it.minStock != null && stock <= it.minStock) low++;
      const soon = lots.some(
        (l) =>
          l.expiresAt &&
          (new Date(l.expiresAt).getTime() - Date.now()) / 86400000 <=
            expiringDays
      );
      if (soon) exp++;
    }
    return { lowStock: low, expiringSoon: exp };
  }, [items, lotsMap, expiringDays]);

  const recent = useMemo(() => movements.slice(-5).reverse(), [movements]);

  return (
    <div className="space-y-4">
      <div className="text-xl">Dashboard</div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Items" value={items.length} />
        <Stat label="Movements" value={movements.length} />
        <Stat label="Low Stock" value={lowStock} />
        <Stat label={`Expiring ≤ ${expiringDays}d`} value={expiringSoon} />
      </div>

      <section className="space-y-2">
        <h3 className="font-medium">Recent Movements</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="text-left px-2 py-1">Date</th>
              <th className="text-left px-2 py-1">Type</th>
              <th className="text-left px-2 py-1">Item</th>
              <th className="text-right px-2 py-1">Qty</th>
            </tr>
          </thead>
          <tbody>
            {recent.map((m) => (
              <tr key={m.id} className="border-b">
                <td className="px-2 py-1">
                  {new Date(m.createdAt).toLocaleString()}
                </td>
                <td className="px-2 py-1">{m.type}</td>
                <td className="px-2 py-1">{m.itemId}</td>
                <td className="px-2 py-1 text-right">{m.qty}</td>
              </tr>
            ))}
            {recent.length === 0 && (
              <tr>
                <td colSpan={4} className="px-2 py-6 text-center text-gray-500">
                  No recent movements
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}

export { Component as default };

export function ErrorBoundary() {
  return <div>Dashboard failed to load.</div>;
}
