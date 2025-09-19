// src/pages/Movements.tsx
import { useMemo, useState, useEffect } from "react";
import { useMovementList, useItemsMap, UIMovement } from "../stores/selectors";
import { useSettingsStore } from "../stores/settingsStore";
import { paginate } from "../utils/pagination";

type ViewType = "ALL" | "IN" | "OUT" | "TRANSFER" | "USE";

function fmtDate(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

export default function Movements() {
  const movements = useMovementList();
  const itemsMap = useItemsMap();
  const [type, setType] = useState<ViewType>("ALL");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = useSettingsStore((s: any) => s.pageSize ?? 20);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    let rows = movements;

    if (type !== "ALL") {
      rows = rows.filter((m: UIMovement) => m.type === type);
    }
    if (query) {
      rows = rows.filter((m: UIMovement) => {
        const itemName = itemsMap[m.itemId]?.name?.toLowerCase() ?? "";
        const reason = m.reason?.toLowerCase() ?? "";
        return itemName.includes(query) || reason.includes(query);
      });
    }

    return rows;
  }, [movements, itemsMap, type, q]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = useMemo(
    () => paginate(filtered, page, pageSize),
    [filtered, page, pageSize]
  );

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">이동 내역</h1>
      {/* Filters and search UI */}
      <div className="border rounded overflow-x-auto">
        <table className="w-full text-sm">
          {/* Table head */}
          <tbody>
            {paged.map((m: UIMovement) => (
              <tr key={m.id} className="border-t">
                <td className="px-3 py-2 whitespace-nowrap">
                  {fmtDate(m.createdAt)}
                </td>
                <td className="px-3 py-2">{m.type}</td>
                <td className="px-3 py-2">
                  {itemsMap[m.itemId]?.name ?? m.itemId}
                </td>
                <td className="px-3 py-2 text-right">{m.qty}</td>
                <td className="px-3 py-2">{m.reason ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-2 border rounded disabled:opacity-50"
          >
            이전
          </button>
          <div className="text-sm">
            페이지 {page} / {totalPages}
          </div>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-2 border rounded disabled:opacity-50"
          >
            다음
          </button>
        </div>
      )}
    </div>
  );
}
