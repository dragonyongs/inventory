// src/pages/Dashboard.tsx
import { useMemo } from "react";
import { useMovementList, useItemsMap } from "../stores/selectors";
import { useLotsStore } from "../stores/lotsStore";
import { useItemsStore } from "../stores/itemsStore";
import { useSettingsStore } from "../stores/settingsStore"; // 만약 없다면 expiringDays 상수로 대체

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="border rounded p-4">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="text-2xl">{value}</div>
    </div>
  );
}

export function Component() {
  const itemsMap = useItemsMap(); // {} 보장
  const movements = useMovementList(); // [] 보장
  const lotsMap = useLotsStore((s) => s.lots ?? {}); // {} 보장
  const lowStockThreshold = useItemsStore((s) => s.lowStockThreshold);
  const expiringDays = useSettingsStore
    ? useSettingsStore((s) => s.expiringDays)
    : 30;

  const items = useMemo(() => Object.values(itemsMap ?? {}), [itemsMap]);
  const itemsCount = items.length;

  const lowStock = useMemo(
    () =>
      items.filter(
        (it: any) =>
          typeof it.stock === "number" && it.stock <= lowStockThreshold
      ).length,
    [items, lowStockThreshold]
  );

  const expiringSoon = useMemo(() => {
    const now = Date.now();
    const horizon = expiringDays * 24 * 60 * 60 * 1000;
    return Object.values(lotsMap ?? {}).filter((l: any) => {
      if (!l.expires_at && !l.expiresAt) return false;
      const t = new Date(l.expires_at ?? l.expiresAt).getTime();
      return !Number.isNaN(t) && t - now <= horizon;
    }).length;
  }, [lotsMap, expiringDays]);

  const recent = useMemo(() => (movements ?? []).slice(0, 5), [movements]);

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-xl font-semibold">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Stat label="Items" value={itemsCount} />
        <Stat label="Movements" value={movements.length} />
        <Stat label="Low Stock" value={lowStock} />
        <Stat label={`Expiring ≤ ${expiringDays}d`} value={expiringSoon} />
      </div>

      <section className="space-y-2">
        <h2 className="font-medium">Recent Movements</h2>
        <table className="table w-full">
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Item</th>
              <th>Qty</th>
            </tr>
          </thead>
          <tbody>
            {recent.map((m) => (
              <tr key={m.id}>
                <td>{new Date(m.createdAt).toLocaleString()}</td>
                <td>{m.type}</td>
                <td>{itemsMap[m.itemId]?.name ?? m.itemId}</td>
                <td>{m.qty}</td>
              </tr>
            ))}
            {recent.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center text-gray-500 py-6">
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
  return <>Dashboard failed to load.</>;
}
