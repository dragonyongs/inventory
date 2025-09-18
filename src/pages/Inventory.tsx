import { useMemo, useState } from "react";
import {
  useItemList,
  useStockByItem,
  useExpiringSoonByItem,
} from "../stores/selectors";
import { useCreateMovement } from "../hooks/useCreateMovement";

function Row({
  id,
  name,
  minStock,
}: {
  id: string;
  name: string;
  minStock?: number;
}) {
  const stock = useStockByItem(id);
  const expSoon = useExpiringSoonByItem(id, 30);
  const create = useCreateMovement();

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
          onClick={() =>
            create({
              id: crypto.randomUUID(),
              type: "IN",
              itemId: id,
              qty: 1,
              createdAt: new Date().toISOString(),
            })
          }
        >
          IN
        </button>
        <button
          className="border px-2 py-1"
          onClick={() =>
            create({
              id: crypto.randomUUID(),
              type: "OUT",
              itemId: id,
              qty: 1,
              createdAt: new Date().toISOString(),
            })
          }
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
  const filtered = useMemo(() => {
    const k = q.trim().toLowerCase();
    return k
      ? items.filter(
          (i) =>
            i.name.toLowerCase().includes(k) || i.sku?.toLowerCase().includes(k)
        )
      : items;
  }, [items, q]);

  return (
    <div className="space-y-3">
      <div className="text-xl">Inventory</div>
      <input
        className="border px-2 py-1"
        placeholder="Search name/SKU"
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
            <Row key={i.id} id={i.id} name={i.name} minStock={i.minStock} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
export { Component as default };
export function ErrorBoundary() {
  return <div>Inventory failed to load.</div>;
}
