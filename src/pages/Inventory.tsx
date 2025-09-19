// src/pages/Inventory.tsx
import { useMemo, useState, useCallback } from "react";
import {
  Plus,
  Search,
  Package,
  AlertTriangle,
  Clock,
  Edit,
  Trash2,
  Settings,
  CheckCircle,
  X,
  ArrowUp,
  ArrowDown,
  RotateCcw,
} from "lucide-react";

import {
  useVisibleItems,
  useStockByItem,
  useExpiringSoonByItem,
  useSetQuery,
  useQuery,
} from "../stores/selectors";
import { useItemsStore, type Item } from "../stores/itemsStore";
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
  className = "",
}: {
  value: any;
  onChange: (v: any) => void;
  placeholder: string;
  type?: string;
  min?: number;
  step?: number | string;
  className?: string;
}) {
  return (
    <input
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
      className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${className}`}
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setErr("");
      setIsSubmitting(true);

      if (!f.name.trim()) {
        setErr("이름은 필수입니다");
        setIsSubmitting(false);
        return;
      }

      if (f.sku.trim() && hasSku(f.sku.trim())) {
        setErr("이미 존재하는 SKU 입니다");
        setIsSubmitting(false);
        return;
      }

      try {
        const item = addItem({
          name: f.name.trim(),
          sku: f.sku.trim() || undefined,
          barcode: f.barcode.trim() || undefined,
          minStock: typeof f.minStock === "number" ? f.minStock : 0,
          defaultPrice: typeof f.price === "number" ? f.price : undefined,
        });

        const qty = typeof f.qty === "number" ? f.qty : 0;
        if (qty > 0) {
          await createMovement({
            type: "IN",
            itemId: item.id,
            qty,
            reason: "초기 재고",
          });
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
      } catch (error) {
        console.error("Movement creation failed:", error);
        setErr("품목 추가 중 오류가 발생했습니다");
      } finally {
        setIsSubmitting(false);
      }
    },
    [f, addItem, hasSku, createMovement, onAdded]
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <Plus className="w-5 h-5 mr-2 text-blue-600" />새 품목 추가
      </h3>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Input
            value={f.name}
            onChange={(v) => setF((s) => ({ ...s, name: v }))}
            placeholder="상품명 *"
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
            min={0}
          />
          <Input
            value={f.price}
            onChange={(v) => setF((s) => ({ ...s, price: v }))}
            placeholder="가격 (선택)"
            type="number"
            step="0.01"
            min={0}
          />
          <Input
            value={f.qty}
            onChange={(v) => setF((s) => ({ ...s, qty: v }))}
            placeholder="초기 수량 (선택)"
            type="number"
            min={0}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex-1">
            {err && (
              <div className="flex items-center text-red-600 text-sm">
                <AlertTriangle className="w-4 h-4 mr-1" />
                {err}
              </div>
            )}
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <Plus className="w-4 h-4 mr-2" />
            )}
            품목 추가
          </button>
        </div>
      </form>
    </div>
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = useCallback(async () => {
    const n = typeof qty === "number" ? qty : 0;
    if (n <= 0) return onClose();

    setIsSubmitting(true);
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
    } finally {
      setIsSubmitting(false);
    }
  }, [mode, qty, reason, itemId, createMovement, onClose]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Settings className="w-5 h-5 mr-2 text-blue-600" />
            재고 조정
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              조정 유형
            </label>
            <div className="flex space-x-2">
              {(
                [
                  ["IN", "입고", ArrowUp],
                  ["OUT", "출고", ArrowDown],
                  ["ADJUST", "조정", RotateCcw],
                ] as const
              ).map(([t, label, Icon]) => (
                <button
                  key={t}
                  onClick={() => setMode(t)}
                  type="button"
                  className={`flex-1 flex items-center justify-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    mode === t
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <Icon className="w-4 h-4 mr-1" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              수량
            </label>
            <input
              type="number"
              value={qty}
              onChange={(e) =>
                setQty(e.target.value === "" ? "" : Number(e.target.value))
              }
              min={0}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              사유 (선택)
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="조정 사유를 입력하세요"
            />
          </div>
        </div>

        <div className="flex space-x-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            취소
          </button>
          <button
            onClick={submit}
            disabled={isSubmitting}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {isSubmitting ? "처리 중..." : "적용"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ItemRow({
  item,
  onEdit,
  onDelete,
  onAdjust,
}: {
  item: Item;
  onEdit: (patch: Partial<Item>) => void;
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

  const isLowStock = stock <= (item.minStock ?? 0);

  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
      <td className="px-6 py-4">
        {editing ? (
          <input
            value={form.name}
            onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
            className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
          />
        ) : (
          <div>
            <div className="font-medium text-gray-900">{item.name}</div>
            <div className="text-sm text-gray-500">
              {item.sku && `SKU: ${item.sku}`}
              {item.sku && item.barcode && " • "}
              {item.barcode && `바코드: ${item.barcode}`}
            </div>
          </div>
        )}
      </td>

      <td className="px-6 py-4">
        <div className="flex items-center space-x-2">
          <span
            className={`text-lg font-semibold ${
              isLowStock ? "text-red-600" : "text-gray-900"
            }`}
          >
            {stock}
          </span>
          <span className="text-sm text-gray-500">개</span>
        </div>
      </td>

      <td className="px-6 py-4">
        <div className="flex flex-wrap gap-1">
          {isLowStock && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
              <AlertTriangle className="w-3 h-3 mr-1" />
              재고 부족
            </span>
          )}
          {expSoon && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
              <Clock className="w-3 h-3 mr-1" />
              유통기한 임박
            </span>
          )}
          {!isLowStock && !expSoon && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              <CheckCircle className="w-3 h-3 mr-1" />
              정상
            </span>
          )}
        </div>
      </td>

      <td className="px-6 py-4">
        {editing ? (
          <div className="flex items-center space-x-2">
            <button
              onClick={save}
              className="flex items-center px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
            >
              <CheckCircle className="w-3 h-3 mr-1" />
              저장
            </button>
            <button
              onClick={() => setEditing(false)}
              className="flex items-center px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600 transition-colors"
            >
              <X className="w-3 h-3 mr-1" />
              취소
            </button>
          </div>
        ) : (
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setEditing(true)}
              className="flex items-center px-2 py-1 text-blue-600 hover:bg-blue-50 rounded text-sm transition-colors"
              title="수정"
            >
              <Edit className="w-3 h-3 mr-1" />
              수정
            </button>
            <button
              onClick={onAdjust}
              className="flex items-center px-2 py-1 text-green-600 hover:bg-green-50 rounded text-sm transition-colors"
              title="재고 조정"
            >
              <Settings className="w-3 h-3 mr-1" />
              조정
            </button>
            <button
              onClick={onDelete}
              className="flex items-center px-2 py-1 text-red-600 hover:bg-red-50 rounded text-sm transition-colors"
              title="삭제"
            >
              <Trash2 className="w-3 h-3 mr-1" />
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
    (id: string, patch: Partial<Item>) => updateItem(id, patch),
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

  // 성공 알림 자동 숨김
  useState(() => {
    if (addedId) {
      const timer = setTimeout(() => setAddedId(null), 3000);
      return () => clearTimeout(timer);
    }
  });

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">인벤토리</h1>
        <p className="text-gray-600">상품을 등록하고 재고를 관리하세요</p>
      </div>

      {/* 성공 알림 */}
      {addedId && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
            <span className="text-green-800 font-medium">
              품목이 성공적으로 추가되었습니다!
            </span>
          </div>
          <button
            onClick={() => setAddedId(null)}
            className="text-green-600 hover:text-green-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 품목 추가 폼 */}
      <AddItemForm onAdded={(id) => setAddedId(id)} />

      {/* 검색 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="상품명, SKU, 바코드로 검색..."
            value={q}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          />
        </div>
      </div>

      {/* 품목 목록 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Package className="w-5 h-5 mr-2 text-blue-600" />
              품목 목록
            </h3>
            <span className="text-sm text-gray-500">
              총 {sorted.length}개 품목
            </span>
          </div>
        </div>

        {sorted.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    상품 정보
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    재고량
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    상태
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    작업
                  </th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((item: any) => (
                  <ItemRow
                    key={item.id}
                    item={item}
                    onEdit={(patch) => handleEdit(item.id, patch)}
                    onDelete={() => handleDelete(item.id)}
                    onAdjust={() => handleAdjust(item.id)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              등록된 품목이 없습니다
            </h3>
            <p className="text-gray-500">
              새 품목을 추가하여 재고 관리를 시작하세요.
            </p>
          </div>
        )}
      </div>

      {/* 재고 조정 모달 */}
      {adjustFor && (
        <AdjustStockModal
          itemId={adjustFor}
          onClose={() => setAdjustFor(null)}
        />
      )}
    </div>
  );
}
