// src/pages/Inventory.tsx
import { useMemo, useState, useCallback } from "react";
import {
  useVisibleItems,
  useStockByItem,
  useExpiringSoonByItem,
  useSetQuery,
  useQuery,
} from "../stores/selectors";
import { useItemsStore } from "../stores/itemsStore";
import { useCreateMovement } from "../hooks/useCreateMovement";

type FormState = {
  name: string;
  sku: string;
  barcode: string;
  minStock: number | "";
  price: number | "";
  qty: number | "";
};

function Input({
  value,
  onChange,
  placeholder,
  type = "text",
  min,
  step,
}: {
  value: any;
  onChange: (v: any) => void;
  placeholder: string;
  type?: string;
  min?: number;
  step?: number | string;
}) {
  return (
    <input
      className="border rounded px-3 py-2 w-full"
      value={value as any}
      onChange={(e) =>
        onChange(
          type === "number"
            ? e.target.value === ""
              ? ""
              : Number(e.target.value)
            : e.target.value
        )
      }
      placeholder={placeholder}
      type={type}
      min={min as any}
      step={step as any}
    />
  );
}

function AddItemForm({ onAdded }: { onAdded: (id: string) => void }) {
  const addItem = useItemsStore((s) => s.addItem);
  const hasSku = useItemsStore((s) => s.hasSku);
  const createMovement = useCreateMovement();

  const [f, setF] = useState<FormState>({
    name: "",
    sku: "",
    barcode: "",
    minStock: "",
    price: "",
    qty: "",
  });
  const [err, setErr] = useState("");

  const onSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setErr("");

      if (!f.name.trim()) {
        setErr("이름은 필수입니다");
        return;
      }
      if (f.sku.trim() && hasSku(f.sku.trim())) {
        setErr("이미 존재하는 SKU 입니다");
        return;
      }

      const item = addItem({
        name: f.name.trim(),
        sku: f.sku.trim() || undefined,
        barcode: f.barcode.trim() || undefined,
        minStock: typeof f.minStock === "number" ? f.minStock : 0,
        defaultPrice: typeof f.price === "number" ? f.price : undefined,
      });

      const qty = typeof f.qty === "number" ? f.qty : 0;
      if (qty > 0) {
        try {
          await createMovement({
            type: "IN",
            itemId: item.id,
            qty,
            reason: "초기 재고",
          } as any);
        } catch (error) {
          console.error("Movement creation failed:", error);
        }
      }

      onAdded(item.id);
      setF({
        name: "",
        sku: "",
        barcode: "",
        minStock: "",
        price: "",
        qty: "",
      });
    },
    [f, addItem, hasSku, createMovement, onAdded]
  );

  return (
    <form
      onSubmit={onSubmit}
      className="bg-white rounded-lg shadow p-4 mb-4 grid grid-cols-1 md:grid-cols-7 gap-3"
    >
      <Input
        value={f.name}
        onChange={(v) => setF((s) => ({ ...s, name: v }))}
        placeholder="이름*"
      />
      <Input
        value={f.sku}
        onChange={(v) => setF((s) => ({ ...s, sku: v }))}
        placeholder="SKU (선택)"
      />
      <Input
        value={f.barcode}
        onChange={(v) => setF((s) => ({ ...s, barcode: v }))}
        placeholder="바코드"
      />
      <Input
        type="number"
        min={0}
        value={f.minStock}
        onChange={(v) => setF((s) => ({ ...s, minStock: v }))}
        placeholder="최소 재고"
      />
      <Input
        type="number"
        min={0}
        step="0.01"
        value={f.price}
        onChange={(v) => setF((s) => ({ ...s, price: v }))}
        placeholder="가격 (선택)"
      />
      <Input
        type="number"
        min={0}
        value={f.qty}
        onChange={(v) => setF((s) => ({ ...s, qty: v }))}
        placeholder="초기 수량 (선택)"
      />
      <button
        type="submit"
        className="bg-blue-600 text-white rounded px-4 py-2 hover:bg-blue-700"
      >
        품목 추가
      </button>
      {err && <div className="md:col-span-7 text-sm text-red-600">{err}</div>}
    </form>
  );
}

function AdjustStockModal({
  itemId,
  onClose,
}: {
  itemId: string;
  onClose: () => void;
}) {
  const createMovement = useCreateMovement();
  const [mode, setMode] = useState<"IN" | "OUT" | "USE">("IN");
  const [qty, setQty] = useState<number | "">("");
  const [reason, setReason] = useState("");

  const submit = useCallback(async () => {
    const n = typeof qty === "number" ? qty : 0;
    if (n <= 0) return onClose();

    try {
      if (mode === "IN") {
        await createMovement({
          type: "IN",
          itemId,
          qty: n,
          reason: reason || "조정-입고",
        } as any);
      } else if (mode === "OUT") {
        await createMovement({
          type: "OUT",
          itemId,
          qty: n,
          reason: reason || "조정-출고",
        } as any);
      } else {
        await createMovement({
          type: "OUT",
          itemId,
          qty: n,
          reason: reason ? `USE: ${reason}` : "USE",
        } as any);
      }
      onClose();
    } catch (error) {
      console.error("Adjust movement failed:", error);
      onClose();
    }
  }, [mode, qty, reason, itemId, createMovement, onClose]);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white p-4 rounded w-full max-w-md space-y-3">
        <h3 className="font-semibold">재고 조정</h3>
        <div className="flex gap-2">
          {(["IN", "OUT", "USE"] as const).map((t) => (
            <button
              key={t}
              className={`px-3 py-1 rounded ${
                mode === t ? "bg-blue-600 text-white" : "bg-gray-100"
              }`}
              onClick={() => setMode(t)}
              type="button"
            >
              {t === "IN" ? "입고" : t === "OUT" ? "출고" : "사용"}
            </button>
          ))}
        </div>
        <Input
          type="number"
          min={0}
          value={qty}
          onChange={setQty}
          placeholder="수량"
        />
        <Input value={reason} onChange={setReason} placeholder="사유 (선택)" />
        <div className="flex justify-end gap-2">
          <button
            className="px-3 py-2 border rounded"
            onClick={onClose}
            type="button"
          >
            취소
          </button>
          <button
            className="px-3 py-2 bg-blue-600 text-white rounded"
            onClick={submit}
            type="button"
          >
            적용
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({
  item,
  onEdit,
  onDelete,
  onAdjust,
}: {
  item: any;
  onEdit: (patch: any) => void;
  onDelete: () => void;
  onAdjust: () => void;
}) {
  const stock = useStockByItem(item.id);
  const expSoon = useExpiringSoonByItem(item.id, 30);

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: item.name,
    sku: item.sku ?? "",
    barcode: item.barcode ?? "",
    minStock: item.minStock ?? 0,
  });

  const save = useCallback(() => {
    onEdit({
      name: form.name,
      sku: form.sku || undefined,
      barcode: form.barcode || undefined,
      minStock: typeof form.minStock === "number" ? form.minStock : 0,
    });
    setEditing(false);
  }, [onEdit, form]);

  return (
    <tr className="border-b">
      <td className="p-3">
        {editing ? (
          <input
            className="border rounded px-2 py-1 w-full"
            value={form.name}
            onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
          />
        ) : (
          <div className="font-medium">{item.name}</div>
        )}
        <div className="text-xs text-gray-500">{item.sku || item.barcode}</div>
      </td>
      <td className="p-3">{stock}</td>
      <td className="p-3">
        <div className="flex gap-2">
          {stock <= (item.minStock ?? 0) && (
            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
              재고 부족
            </span>
          )}
          {expSoon && (
            <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded">
              유통기한 임박
            </span>
          )}
        </div>
      </td>
      <td className="p-3">
        {editing ? (
          <div className="flex flex-wrap gap-2">
            {/* Edit form inputs */}
            <button
              className="px-3 py-1 bg-blue-600 text-white rounded"
              onClick={save}
            >
              저장
            </button>
            <button
              className="px-3 py-1 border rounded"
              onClick={() => setEditing(false)}
            >
              취소
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <button
              className="px-3 py-1 border rounded"
              onClick={() => setEditing(true)}
            >
              수정
            </button>
            <button
              className="px-3 py-1 bg-blue-600 text-white rounded"
              onClick={onAdjust}
            >
              조정
            </button>
            <button
              className="px-3 py-1 bg-red-600 text-white rounded"
              onClick={onDelete}
            >
              삭제
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}

export default function Inventory() {
  const items = useVisibleItems();
  const setQuery = useSetQuery();
  const q = useQuery();

  const updateItem = useItemsStore((s) => s.updateItem);
  const removeItem = useItemsStore((s) => s.removeItem);

  const [adjustFor, setAdjustFor] = useState<string | null>(null);
  const [addedId, setAddedId] = useState<string | null>(null);

  const sorted = useMemo(
    () =>
      [...items].sort(
        (a: any, b: any) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    [items]
  );

  const handleEdit = useCallback(
    (id: string, patch: any) => updateItem(id, patch),
    [updateItem]
  );

  const handleDelete = useCallback(
    (id: string) => {
      if (window.confirm("정말 삭제하시겠습니까?")) {
        removeItem(id);
      }
    },
    [removeItem]
  );

  const handleAdjust = useCallback((id: string) => {
    setAdjustFor(id);
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">인벤토리</h1>

      <AddItemForm onAdded={setAddedId} />

      <div className="flex items-center justify-between mb-3">
        <input
          className="border rounded px-3 py-2 w-full md:w-96"
          placeholder="이름, SKU, 바코드 검색..."
          value={q}
          onChange={(e) => setQuery(e.target.value)}
        />
        {addedId && (
          <span className="ml-3 text-sm text-green-700">
            품목이 추가되었습니다
          </span>
        )}
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          {/* Table head */}
          <tbody>
            {sorted.map((it: any) => (
              <Row
                key={it.id}
                item={it}
                onEdit={(patch) => handleEdit(it.id, patch)}
                onDelete={() => handleDelete(it.id)}
                onAdjust={() => handleAdjust(it.id)}
              />
            ))}
            {sorted.length === 0 && (
              <tr>
                <td className="p-4 text-gray-500" colSpan={4}>
                  등록된 품목이 없습니다
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {adjustFor && (
        <AdjustStockModal
          itemId={adjustFor}
          onClose={() => setAdjustFor(null)}
        />
      )}
    </div>
  );
}
