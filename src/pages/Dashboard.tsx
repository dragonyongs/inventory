// src/pages/Dashboard.tsx
import { useMemo } from "react";
import {
  useMovementList,
  useItemsMap,
  type UIMovement,
} from "../stores/selectors";
import { useLotsStore } from "../stores/lotsStore";
import { useItemsStore } from "../stores/itemsStore";

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  );
}

export default function Dashboard() {
  const items = useItemsStore((s) => s.items);
  const lots = useLotsStore((s) => s.lots);
  const movements = useMovementList();
  const itemsMap = useItemsMap();

  const totalStock = useMemo(
    () => Object.values(lots).reduce((sum: any, lot: any) => sum + lot.qty, 0),
    [lots]
  );
  const totalItems = useMemo(() => Object.keys(items).length, [items]);

  const recentMovements = useMemo(() => {
    return [...movements]
      .sort(
        (a: UIMovement, b: UIMovement) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, 5);
  }, [movements]);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">대시보드</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Stat label="총 재고 수량" value={totalStock} />
        <Stat label="총 품목 수" value={totalItems} />
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="font-semibold mb-2">최근 활동</h2>
        {recentMovements.length === 0 ? (
          <div className="text-gray-500">최근 활동이 없습니다.</div>
        ) : (
          <table className="min-w-full">
            <thead>
              <tr>
                <th className="text-left py-2">일시</th>
                <th className="text-left py-2">유형</th>
                <th className="text-left py-2">품목</th>
                <th className="text-right py-2">수량</th>
              </tr>
            </thead>
            <tbody>
              {recentMovements.map((m: UIMovement) => (
                <tr key={m.id}>
                  <td>{new Date(m.createdAt).toLocaleString()}</td>
                  <td>{m.type}</td>
                  <td>{itemsMap[m.itemId]?.name ?? m.itemId}</td>
                  <td className="text-right">{m.qty}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
