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
      className="border rounded px-2 py-1"
      value={value}
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
          });
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
    <form onSubmit={onSubmit} className="space-y-2">
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
        value={f.minStock}
        onChange={(v) => setF((s) => ({ ...s, minStock: v }))}
        placeholder="최소 재고"
        type="number"
      />
      <Input
        value={f.price}
        onChange={(v) => setF((s) => ({ ...s, price: v }))}
        placeholder="가격 (선택)"
        type="number"
        step="0.01"
      />
      <Input
        value={f.qty}
        onChange={(v) => setF((s) => ({ ...s, qty: v }))}
        placeholder="초기 수량 (선택)"
        type="number"
      />
      <button
        type="submit"
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        품목 추가
      </button>
      {err && <div className="text-red-500">{err}</div>}
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
  const [mode, setMode] = useState<"IN" | "OUT" | "ADJUST">("IN");
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
        });
      } else if (mode === "OUT") {
        await createMovement({
          type: "OUT",
          itemId,
          qty: n,
          reason: reason || "조정-출고",
        });
      } else {
        await createMovement({
          type: "ADJUST",
          itemId,
          qty: n,
          reason: reason || "재고조정",
        });
      }
      onClose();
    } catch (error) {
      console.error("Adjust movement failed:", error);
      onClose();
    }
  }, [mode, qty, reason, itemId, createMovement, onClose]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
      <div className="bg-white p-4 rounded-lg space-y-4">
        <h3 className="text-lg font-semibold">재고 조정</h3>

        <div className="flex gap-2">
          {(["IN", "OUT", "ADJUST"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setMode(t)}
              type="button"
              className={`px-3 py-1 rounded ${
                mode === t ? "bg-blue-500 text-white" : "bg-gray-200"
              }`}
            >
              {t === "IN" ? "입고" : t === "OUT" ? "출고" : "조정"}
            </button>
          ))}
        </div>

        <Input
          value={qty}
          onChange={setQty}
          placeholder="수량"
          type="number"
          min={1}
        />

        <Input value={reason} onChange={setReason} placeholder="사유" />

        <div className="flex gap-2">
          <button onClick={onClose} className="px-4 py-2 bg-gray-300 rounded">
            취소
          </button>
          <button
            onClick={submit}
            className="px-4 py-2 bg-blue-500 text-white rounded"
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
      <td className="p-2">
        {editing ? (
          <input
            value={form.name}
            onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
            className="border rounded px-2 py-1"
          />
        ) : (
          <span>{item.name}</span>
        )}
      </td>
      <td className="p-2">{item.sku || item.barcode}</td>
      <td className="p-2">{stock}</td>
      <td className="p-2">
        {stock <= (item.minStock ?? 0) && (
          <span className="text-red-500 text-sm">재고 부족</span>
        )}
        {expSoon && (
          <span className="text-orange-500 text-sm">유통기한 임박</span>
        )}
      </td>
      <td className="p-2">
        {editing ? (
          <div className="space-x-2">
            <button onClick={save} className="text-blue-500 text-sm">
              저장
            </button>
            <button
              onClick={() => setEditing(false)}
              className="text-gray-500 text-sm"
            >
              취소
            </button>
          </div>
        ) : (
          <div className="space-x-2">
            <button
              onClick={() => setEditing(true)}
              className="text-blue-500 text-sm"
            >
              수정
            </button>
            <button onClick={onAdjust} className="text-green-500 text-sm">
              조정
            </button>
            <button onClick={onDelete} className="text-red-500 text-sm">
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
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime()
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
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">인벤토리</h1>

      <AddItemForm onAdded={(id) => setAddedId(id)} />

      <input
        className="w-full border rounded px-3 py-2"
        placeholder="검색..."
        value={q}
        onChange={(e) => setQuery(e.target.value)}
      />

      {addedId && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          품목이 추가되었습니다
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse border">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2 text-left">이름</th>
              <th className="border p-2 text-left">SKU/바코드</th>
              <th className="border p-2 text-left">재고</th>
              <th className="border p-2 text-left">상태</th>
              <th className="border p-2 text-left">액션</th>
            </tr>
          </thead>
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
                <td colSpan={5} className="text-center p-8 text-gray-500">
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
