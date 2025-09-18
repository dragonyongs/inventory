import { useMemo, useState } from "react";
import { BarcodeScanner } from "../components/BarcodeScanner";
import {
  useItemList,
  useStockByItem,
  useExpiringSoonByItem,
} from "../stores/selectors";
import { useCreateMovement } from "../hooks/useCreateMovement";
import { useSettingsStore } from "../stores/settingsStore";
import { useWorkspaceStore } from "../stores/workspaceStore";

function Row({
  id,
  name,
  minStock,
  barcode,
}: {
  id: string;
  name: string;
  minStock?: number;
}) {
  const expiringDays = useSettingsStore((s) => s.expiringDays); // 설정 연동
  const stock = useStockByItem(id);
  const expSoon = useExpiringSoonByItem(id, expiringDays); // 기존 30 -> 설정값
  const create = useCreateMovement();
  const wsId = useWorkspaceStore((s) => s.currentId);
  const canEdit = true; // 이후 useWorkspaceStore(s=>s.can(wsId!, 'edit'))로 치환

  return (
    <tr className="border-b">
      <td className="px-2 py-1">{name}</td>
      <td className="px-2 py-1 text-right">{stock}</td>
      <td className="px-2 py-1">
        {minStock && stock <= minStock ? (
          <span className="text-red-600">Low</span>
        ) : null}
        {expSoon ? <span className="ml-2 text-amber-600">Expiring</span> : null}
      </td>
      <td className="px-2 py-1 text-right space-x-2">
        <button
          className="border px-2 py-1"
          disabled={!canEdit}
          onClick={() => create({ type: "IN", itemId: id, qty: 1 })}
        >
          IN
        </button>
        <button
          className="border px-2 py-1"
          disabled={!canEdit || stock <= 0}
          onClick={() => create({ type: "OUT", itemId: id, qty: 1 })}
        >
          OUT
        </button>
      </td>
    </tr>
  );
}

export function Component() {
  const items = useItemList();
  const [q, setQ] = useState("");
  const [scan, setScan] = useState(false);

  const filtered = useMemo(() => {
    const k = q.trim().toLowerCase();
    return k
      ? items.filter(
          (i) =>
            i.name.toLowerCase().includes(k) ||
            i.sku?.toLowerCase().includes(k) ||
            i.barcode?.toLowerCase().includes(k) ||
            i.id.toLowerCase().includes(k)
        )
      : items;
  }, [items, q]);

  return (
    <div className="space-y-3">
      <div className="text-xl">Inventory</div>
      <button
        className="ml-auto border px-2 py-1"
        onClick={() => setScan(true)}
      >
        Scan
      </button>

      <input
        className="border px-2 py-1"
        placeholder="Search name/SKU/Barcode"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-gray-50">
            <th className="text-left px-2 py-1">Item</th>
            <th className="text-right px-2 py-1">Stock</th>
            <th className="text-left px-2 py-1">Flags</th>
            <th className="text-right px-2 py-1">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((i) => (
            <Row
              key={i.id}
              id={i.id}
              name={i.name}
              minStock={i.minStock}
              barcode={i.barcode}
            />
          ))}
        </tbody>
      </table>

      {scan && (
        <BarcodeScanner
          onDetect={(code) => {
            setQ(code);
          }}
          onClose={() => setScan(false)}
        />
      )}
    </div>
  );
}
export { Component as default };
export function ErrorBoundary() {
  return <div>Inventory failed to load.</div>;
}
