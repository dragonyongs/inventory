// src/pages/Movements.tsx
import { useMemo, useState, useEffect } from "react";
import {
  useMovementList,
  useItemsMap,
  type UIMovement,
} from "../stores/selectors";
import { useSettingsStore } from "../stores/settingsStore";

type ViewType = "ALL" | "IN" | "OUT" | "TRANSFER" | "USE" | "ADJUST";

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("ko-KR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const paginate = (items: any[], page: number, pageSize: number) => {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
};

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
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">이동 내역</h1>
        <p className="text-gray-600">모든 재고 이동 내역을 확인하세요</p>
      </div>

      {/* 필터 및 검색 */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {(
              ["ALL", "IN", "OUT", "ADJUST", "TRANSFER", "USE"] as ViewType[]
            ).map((t) => (
              <button
                key={t}
                onClick={() => {
                  setType(t);
                  setPage(1);
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  type === t
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {t === "ALL"
                  ? "전체"
                  : t === "IN"
                  ? "입고"
                  : t === "OUT"
                  ? "출고"
                  : t === "ADJUST"
                  ? "조정"
                  : t === "TRANSFER"
                  ? "이동"
                  : "사용"}
              </button>
            ))}
          </div>

          <div className="flex-1 lg:flex-initial lg:w-64">
            <input
              type="text"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              placeholder="상품명 또는 사유로 검색..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* 테이블 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                  날짜
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                  유형
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                  상품
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                  수량
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                  사유
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paged.map((m: UIMovement, index) => (
                <tr
                  key={m.id}
                  className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                >
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {formatDate(m.createdAt)}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        m.type === "IN"
                          ? "bg-green-100 text-green-800"
                          : m.type === "OUT"
                          ? "bg-red-100 text-red-800"
                          : m.type === "ADJUST"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {m.type === "IN"
                        ? "입고"
                        : m.type === "OUT"
                        ? "출고"
                        : m.type === "ADJUST"
                        ? "조정"
                        : m.type === "TRANSFER"
                        ? "이동"
                        : "사용"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {itemsMap[m.itemId]?.name ?? m.itemId}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`text-sm font-semibold ${
                        m.type === "IN" ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {m.type === "IN" ? "+" : m.type === "OUT" ? "-" : "±"}
                      {m.qty}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {m.reason ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {paged.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">조건에 맞는 이동 내역이 없습니다.</p>
          </div>
        )}

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 text-sm font-medium border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                이전
              </button>
              <span className="text-sm text-gray-700">
                페이지 {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 text-sm font-medium border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                다음
              </button>
            </div>
            <div className="text-sm text-gray-500">
              총 {filtered.length}개 항목
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
