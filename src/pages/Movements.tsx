import { useMemo, useState } from "react";
import { useMovementList, useItemsMap } from "../stores/selectors";

type MovementType = "IN" | "OUT" | "ADJUST" | "TRANSFER";

function fmtDate(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

function useFilters() {
  const [type, setType] = useState<"ALL" | MovementType>("ALL");
  const [q, setQ] = useState("");
  return { type, setType, q, setQ };
}

function paginate<T>(rows: T[], page: number, size: number) {
  const start = (page - 1) * size;
  return rows.slice(start, start + size);
}

export function Component() {
  const movements = useMovementList();
  const itemsMap = useItemsMap();
  const { type, setType, q, setQ } = useFilters();
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const filtered = useMemo(() => {
    const key = q.trim().toLowerCase();
    return movements
      .filter((m) => (type === "ALL" ? true : m.type === type))
      .filter((m) => {
        if (!key) return true;
        const name = itemsMap[m.itemId]?.name?.toLowerCase() ?? "";
        const sku = itemsMap[m.itemId]?.sku?.toLowerCase() ?? "";
        return (
          name.includes(key) ||
          sku.includes(key) ||
          m.itemId.toLowerCase().includes(key)
        );
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [movements, itemsMap, type, q]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows = paginate(filtered, Math.min(page, totalPages), pageSize);

  return (
    <div className="space-y-3">
      <div className="text-xl">Movements</div>

      <div className="flex gap-2 items-center">
        <select
          className="border px-2 py-1"
          value={type}
          onChange={(e) => {
            setType(e.target.value as any);
            setPage(1);
          }}
        >
          <option value="ALL">ALL</option>
          <option value="IN">IN</option>
          <option value="OUT">OUT</option>
          <option value="ADJUST">ADJUST</option>
          <option value="TRANSFER">TRANSFER</option>
        </select>
        <input
          className="border px-2 py-1"
          placeholder="Search item name/SKU/ID"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
        />
        <div className="ml-auto text-sm text-gray-600">
          Total: {filtered.length} · Page {Math.min(page, totalPages)}/
          {totalPages}
        </div>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-gray-50">
            <th className="text-left px-2 py-1">Date</th>
            <th className="text-left px-2 py-1">Type</th>
            <th className="text-left px-2 py-1">Item</th>
            <th className="text-left px-2 py-1">Lot</th>
            <th className="text-right px-2 py-1">Qty</th>
            <th className="text-left px-2 py-1">Reason</th>
          </tr>
        </thead>
        <tbody>
          {pageRows.map((m) => (
            <tr key={m.id} className="border-b">
              <td className="px-2 py-1">{fmtDate(m.createdAt)}</td>
              <td className="px-2 py-1">{m.type}</td>
              <td className="px-2 py-1">
                {itemsMap[m.itemId]?.name ?? m.itemId}
                {itemsMap[m.itemId]?.sku ? ` (${itemsMap[m.itemId]?.sku})` : ""}
              </td>
              <td className="px-2 py-1">{m.lotId ?? "-"}</td>
              <td className="px-2 py-1 text-right">{m.qty}</td>
              <td className="px-2 py-1">{m.reason ?? "-"}</td>
            </tr>
          ))}
          {pageRows.length === 0 && (
            <tr>
              <td colSpan={6} className="px-2 py-6 text-center text-gray-500">
                No movements
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="flex items-center justify-end gap-2">
        <button
          className="border px-2 py-1"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page <= 1}
        >
          Prev
        </button>
        <button
          className="border px-2 py-1"
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page >= totalPages}
        >
          Next
        </button>
      </div>
    </div>
  );
}

export { Component as default };
export function ErrorBoundary() {
  return <div>Movements failed to load.</div>;
}
