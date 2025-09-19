// src/pages/Movements.tsx
import { useMemo, useState, useEffect } from "react";
import { useMovementList, useItemsMap } from "../stores/selectors";
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
  const movements = useMovementList(); // 정규화+캐시된 리스트
  const itemsMap = useItemsMap();

  const [type, setType] = useState<ViewType>("ALL");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = useSettingsStore((s: any) => s.pageSize ?? 20);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    let rows = movements;

    // 유형 필터
    rows =
      type === "ALL"
        ? rows
        : type === "USE"
        ? rows.filter(
            (m) =>
              m.type === "OUT" &&
              (m.reason?.toUpperCase().startsWith("USE") ||
                m.reason?.includes("사용"))
          )
        : rows.filter((m) => m.type === type);

    // 검색 필터 (품목명/ID/사유)
    if (query) {
      rows = rows.filter((m) => {
        const itemName = itemsMap[m.itemId]?.name?.toLowerCase() ?? "";
        const itemId = m.itemId.toLowerCase();
        const reason = m.reason?.toLowerCase() ?? "";
        return (
          itemName.includes(query) ||
          itemId.includes(query) ||
          reason.includes(query)
        );
      });
    }

    // 최신순 정렬
    return rows.toSorted(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
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

      {/* 필터/검색 */}
      <div className="flex flex-wrap gap-2 items-center">
        <label className="text-sm">유형</label>
        <select
          value={type}
          onChange={(e) => {
            setType(e.target.value as ViewType);
            setPage(1);
          }}
          className="border rounded px-3 py-2"
        >
          <option value="ALL">전체</option>
          <option value="IN">입고</option>
          <option value="OUT">출고</option>
          <option value="TRANSFER">이동</option>
          <option value="USE">사용</option>
        </select>

        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
          placeholder="품목/사유 검색..."
          className="border rounded px-3 py-2 min-w-[260px] flex-1"
        />
        <div className="text-sm text-gray-600">
          총 {filtered.length}건 중 {paged.length}건 표시
        </div>
      </div>

      {/* 표 */}
      <div className="border rounded overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-3 py-2">일시</th>
              <th className="text-left px-3 py-2">유형</th>
              <th className="text-left px-3 py-2">품목</th>
              <th className="text-right px-3 py-2">수량</th>
              <th className="text-left px-3 py-2">사유</th>
            </tr>
          </thead>
          <tbody>
            {paged.map((m) => (
              <tr key={m.id} className="border-t">
                <td className="px-3 py-2 whitespace-nowrap">
                  {fmtDate(m.createdAt)}
                </td>
                <td className="px-3 py-2">
                  {m.type === "IN"
                    ? "입고"
                    : m.type === "OUT"
                    ? "출고"
                    : m.type === "TRANSFER"
                    ? "이동"
                    : m.type}
                </td>
                <td className="px-3 py-2">
                  {itemsMap[m.itemId]?.name ?? m.itemId}
                </td>
                <td className="px-3 py-2 text-right">{m.qty}</td>
                <td className="px-3 py-2">{m.reason ?? "-"}</td>
              </tr>
            ))}
            {paged.length === 0 && (
              <tr>
                <td className="px-3 py-6 text-center text-gray-500" colSpan={5}>
                  표시할 이동 내역이 없습니다
                </td>
              </tr>
            )}
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
