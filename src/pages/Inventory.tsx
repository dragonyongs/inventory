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
  Calendar,
  Hash,
  Barcode,
  DollarSign,
  TrendingUp,
} from "lucide-react";

import {
  useVisibleItems,
  useStockByItem,
  useExpiringSoonByItem,
  useSetQuery,
  useQuery,
} from "../stores/selectors";
import { getActionLabels } from "../utils/workspaceLabels";
import { useWorkspaceStore } from "../stores/workspaceStore";
import { useItemsStore, type Item } from "../stores/itemsStore";
import { useCreateMovement } from "../hooks/useCreateMovement";
import {
  calculateDaysUntilExpiry,
  getExpiryStatus,
} from "../utils/expiryUtils";

type FormState = {
  name: string;
  sku: string;
  barcode: string;
  minStock: number | "";
  price: number | "";
  qty: number | "";
  expiryDate: string;
  batchNumber: string;
  receivedDate: string;
};

function Input({
  value,
  onChange,
  placeholder,
  type = "text",
  min,
  step,
  className = "",
  required = false,
}: {
  value: any;
  onChange: (v: any) => void;
  placeholder: string;
  type?: string;
  min?: number;
  step?: number | string;
  className?: string;
  required?: boolean;
}) {
  return (
    <div className="relative">
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
        required={required}
        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
          required ? "border-blue-200 bg-blue-50/30" : ""
        } ${className}`}
      />
      {required && (
        <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full"></span>
      )}
    </div>
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
    expiryDate: "",
    batchNumber: "",
    receivedDate: new Date().toISOString().split("T")[0], // 🔧 기본값을 오늘로 설정
  });
  const [err, setErr] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const onSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setErr("");
      setIsSubmitting(true);

      if (!f.name.trim()) {
        setErr("상품명을 입력해주세요.");
        setIsSubmitting(false);
        return;
      }

      if (f.sku.trim() && hasSku(f.sku.trim())) {
        setErr("이미 존재하는 SKU입니다.");
        setIsSubmitting(false);
        return;
      }

      try {
        // ✅ 수정: 상품 생성 시 재고는 0으로 시작
        const item = addItem({
          name: f.name.trim(),
          sku: f.sku.trim() || undefined,
          barcode: f.barcode.trim() || undefined,
          minStock: typeof f.minStock === "number" ? f.minStock : 0,
          defaultPrice: typeof f.price === "number" ? f.price : undefined,
          stock: 0, // ✅ 항상 0으로 시작 (중복 방지)
          category: undefined,
          expiryDate: f.expiryDate || undefined,
          batchNumber: f.batchNumber.trim() || undefined,
          receivedDate: f.receivedDate || undefined,
        });

        console.log("✅ 상품 생성 완료:", {
          itemId: item.id,
          name: item.name,
          initialStock: item.stock, // 0이어야 함
          inputQuantity: f.qty,
        });

        // ✅ 수정: 입력한 수량이 있을 때만 입고 움직임 생성
        const qty = typeof f.qty === "number" ? f.qty : 0;
        if (qty > 0) {
          console.log("✅ 초기 입고 움직임 생성:", qty);
          await createMovement({
            type: "IN",
            itemId: item.id,
            qty,
            reason: "초기 재고",
          });
        }

        onAdded(item.id);

        // 폼 초기화
        setF({
          name: "",
          sku: "",
          barcode: "",
          minStock: "",
          price: "",
          qty: "",
          expiryDate: "",
          batchNumber: "",
          receivedDate: new Date().toISOString().split("T")[0],
        });
        setShowAdvanced(false);
      } catch (error) {
        console.error("Movement creation failed:", error);
        setErr("상품 등록 중 오류가 발생했습니다.");
      } finally {
        setIsSubmitting(false);
      }
    },
    [f, addItem, hasSku, createMovement, onAdded]
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
      <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
        <Plus className="w-5 h-5 mr-2 text-blue-600" />새 품목 추가
      </h3>

      <form onSubmit={onSubmit} className="space-y-6">
        {/* 🎯 필수/기본 정보 섹션 */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-gray-900 flex items-center">
              <Package className="w-4 h-4 mr-2 text-blue-600" />
              기본 정보
            </h4>
            <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
              ⭐ 중요
            </span>
          </div>

          {/* 상품명 (필수) */}
          <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                상품명 <span className="text-red-500">*</span>
              </label>
              <Input
                value={f.name}
                onChange={(v) => setF((s) => ({ ...s, name: v }))}
                placeholder="예: 사과, 노트북, 세제..."
                required={true}
              />
            </div>
          </div>

          {/* 재고/가격 정보 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                최소 재고
              </label>
              <Input
                value={f.minStock}
                onChange={(v) => setF((s) => ({ ...s, minStock: v }))}
                placeholder="10"
                type="number"
                min={0}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                가격
              </label>
              <Input
                value={f.price}
                onChange={(v) => setF((s) => ({ ...s, price: v }))}
                placeholder="1000"
                type="number"
                step="0.01"
                min={0}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                초기 수량
              </label>
              <Input
                value={f.qty}
                onChange={(v) => setF((s) => ({ ...s, qty: v }))}
                placeholder="100"
                type="number"
                min={0}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                입고일 <span className="text-blue-500 text-xs">(중요)</span>
              </label>
              <Input
                value={f.receivedDate}
                onChange={(v) => setF((s) => ({ ...s, receivedDate: v }))}
                type="date"
                placeholder="수량 입력"
                required={true}
              />
            </div>
          </div>
        </div>

        {/* 🏷️ 추가 옵션 토글 버튼 */}
        <div className="border-t border-gray-200 pt-4">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <Settings className="w-4 h-4 mr-2" />
            추가 옵션 {showAdvanced ? "숨기기" : "보기"}
            <span className="ml-2 text-xs text-gray-400">
              (식별정보, 품질관리)
            </span>
            {showAdvanced ? (
              <X className="w-4 h-4 ml-auto" />
            ) : (
              <Plus className="w-4 h-4 ml-auto" />
            )}
          </button>
        </div>

        {/* 🔧 고급 옵션 (조건부 표시) */}
        {showAdvanced && (
          <div className="space-y-6 bg-gray-50 rounded-lg p-4">
            {/* 식별 정보 섹션 */}
            <div className="space-y-4">
              <div className="flex items-center">
                <h4 className="text-sm font-medium text-gray-700 flex items-center">
                  <Hash className="w-4 h-4 mr-2 text-gray-500" />
                  식별 정보
                </h4>
                <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded-full ml-2">
                  선택
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    SKU (제품코드)
                  </label>
                  <Input
                    value={f.sku}
                    onChange={(v) => setF((s) => ({ ...s, sku: v }))}
                    placeholder="예: APP-001"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    바코드
                  </label>
                  <Input
                    value={f.barcode}
                    onChange={(v) => setF((s) => ({ ...s, barcode: v }))}
                    placeholder="예: 8801234567890"
                  />
                </div>
              </div>
            </div>

            {/* 품질 관리 섹션 */}
            <div className="space-y-4">
              <div className="flex items-center">
                <h4 className="text-sm font-medium text-gray-700 flex items-center">
                  <Calendar className="w-4 h-4 mr-2 text-orange-500" />
                  품질 관리
                </h4>
                <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded-full ml-2">
                  선택
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    유통기한
                  </label>
                  <Input
                    value={f.expiryDate}
                    onChange={(v) => setF((s) => ({ ...s, expiryDate: v }))}
                    type="date"
                    placeholder="예: 2024-12-31"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    로트번호
                  </label>
                  <Input
                    value={f.batchNumber}
                    onChange={(v) => setF((s) => ({ ...s, batchNumber: v }))}
                    placeholder="예: LOT-20250923"
                  />
                </div>
              </div>

              <p className="text-xs text-gray-500 flex items-start">
                <AlertTriangle className="w-3 h-3 mr-1 mt-0.5 flex-shrink-0 text-orange-400" />
                유통기한은 만료 알림에 사용되며, 로트번호는 품질 추적에
                활용됩니다.
              </p>
            </div>
          </div>
        )}

        {/* 제출 버튼 영역 */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
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
            disabled={isSubmitting || !f.name.trim()}
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
  const [adjustmentType, setAdjustmentType] = useState<
    "IN" | "OUT" | "USE" | "ADJUST"
  >("ADJUST"); // ✅ 기본값을 ADJUST로 변경
  const [qty, setQty] = useState<number | "">(0);
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ✅ 현재 아이템 정보 가져오기
  const items = useVisibleItems();
  const currentItem = items.find((item) => item.id === itemId);
  const currentStock = currentItem?.stock || 0;

  const submit = useCallback(async () => {
    const n = typeof qty === "number" ? qty : 0;
    if (n <= 0 && adjustmentType !== "ADJUST") return onClose();

    setIsSubmitting(true);
    try {
      if (adjustmentType === "ADJUST") {
        // ✅ 핵심 수정: ADJUST 타입일 때 절대값 모드 사용
        await createMovement({
          type: "ADJUST",
          itemId,
          qty: n,
          reason: reason || `재고조정: ${currentStock}개 → ${n}개`,
          isAbsoluteValue: true, // ✅ 절대값 모드 활성화
        });
      } else {
        // ✅ 기존 IN, OUT, USE 로직 유지
        await createMovement({
          type: adjustmentType,
          itemId,
          qty: n,
          reason: reason || adjustmentType,
        });
      }
      onClose();
    } catch (error) {
      console.error("Adjust movement failed:", error);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  }, [
    adjustmentType,
    qty,
    reason,
    itemId,
    currentStock,
    createMovement,
    onClose,
  ]);

  const getCurrentWorkspace = useWorkspaceStore((s) => s.getCurrentWorkspace);
  const currentWorkspace = getCurrentWorkspace();
  const actionLabels = getActionLabels(currentWorkspace?.type || "DEFAULT");

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

        {/* ✅ 현재 재고 표시 추가 */}
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-600">현재 재고</div>
          <div className="text-2xl font-bold text-gray-900">
            {currentStock.toLocaleString()}개
          </div>
        </div>

        <div className="gap-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              조정 유형
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setAdjustmentType("IN")}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  adjustmentType === "IN"
                    ? "bg-green-100 text-green-800 border border-green-200"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {actionLabels.IN}
              </button>
              <button
                type="button"
                onClick={() => setAdjustmentType("OUT")}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  adjustmentType === "OUT"
                    ? "bg-red-100 text-red-800 border border-red-200"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {actionLabels.OUT}
              </button>
              <button
                type="button"
                onClick={() => setAdjustmentType("USE")}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  adjustmentType === "USE"
                    ? "bg-blue-100 text-blue-800 border border-blue-200"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {actionLabels.USE}
              </button>
              <button
                type="button"
                onClick={() => setAdjustmentType("ADJUST")}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  adjustmentType === "ADJUST"
                    ? "bg-orange-100 text-orange-800 border border-orange-200"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {actionLabels.ADJUST}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {adjustmentType === "ADJUST" ? "최종 재고 수량" : "수량"}
            </label>
            <input
              type="number"
              value={qty}
              onChange={(e) =>
                setQty(e.target.value ? Number(e.target.value) : "")
              }
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={
                adjustmentType === "ADJUST"
                  ? "최종 재고 수량 입력"
                  : "수량 입력"
              }
            />
            {/* ✅ ADJUST 모드일 때 변화량 표시 */}
            {adjustmentType === "ADJUST" &&
              typeof qty === "number" &&
              qty !== currentStock && (
                <p
                  className={`text-sm mt-1 ${
                    qty > currentStock ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {qty > currentStock ? "+" : ""}
                  {qty - currentStock}개 변화
                </p>
              )}
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

// 🔧 개선된 ItemRow 컴포넌트
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
    defaultPrice: item.defaultPrice ?? "",
    expiryDate: item.expiryDate ?? "",
    batchNumber: item.batchNumber ?? "",
    receivedDate: item.receivedDate ?? "",
  });

  const expiryStatus = useMemo(() => {
    return item.expiryDate ? getExpiryStatus(item.expiryDate) : null;
  }, [item.expiryDate]);

  const save = useCallback(() => {
    onEdit({
      name: form.name,
      sku: form.sku || undefined,
      barcode: form.barcode || undefined,
      minStock: typeof form.minStock === "number" ? form.minStock : 0,
      defaultPrice:
        typeof form.defaultPrice === "number" ? form.defaultPrice : undefined,
      expiryDate: form.expiryDate || undefined,
      batchNumber: form.batchNumber || undefined,
      receivedDate: form.receivedDate || undefined,
    });
    setEditing(false);
  }, [onEdit, form]);

  const isLowStock = stock <= (item.minStock ?? 0);

  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
      {/* 🎯 상품 정보 (간소화) */}
      <td className="px-6 py-4">
        {editing ? (
          <div className="space-y-2">
            <input
              value={form.name}
              onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium"
              placeholder="상품명"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                value={form.sku}
                onChange={(e) =>
                  setForm((s) => ({ ...s, sku: e.target.value }))
                }
                className="px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm"
                placeholder="SKU"
              />
              <input
                value={form.barcode}
                onChange={(e) =>
                  setForm((s) => ({ ...s, barcode: e.target.value }))
                }
                className="px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm"
                placeholder="바코드"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                value={form.minStock}
                onChange={(e) =>
                  setForm((s) => ({
                    ...s,
                    minStock: Number(e.target.value) || 0,
                  }))
                }
                className="px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm"
                placeholder="최소재고"
                type="number"
                min="0"
              />
              <input
                value={form.defaultPrice}
                onChange={(e) =>
                  setForm((s) => ({ ...s, defaultPrice: e.target.value }))
                }
                className="px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm"
                placeholder="가격"
                type="number"
                step="0.01"
              />
            </div>
          </div>
        ) : (
          <div>
            <div className="font-medium text-gray-900 text-sm">{item.name}</div>
            <div className="text-xs text-gray-500 mt-1">
              {item.sku && `SKU: ${item.sku}`}
              {item.sku && item.barcode && " • "}
              {item.barcode && `바코드: ${item.barcode}`}
            </div>
            {(item.minStock || item.defaultPrice) && (
              <div className="text-xs text-gray-600 mt-1 space-y-1">
                {item.minStock && <div>최소: {item.minStock}개</div>}
                {item.defaultPrice && (
                  <div>가격: {item.defaultPrice.toLocaleString()}원</div>
                )}
              </div>
            )}
            {item.batchNumber && (
              <div className="text-xs text-orange-600 mt-1">
                로트: {item.batchNumber}
              </div>
            )}
          </div>
        )}
      </td>

      {/* 📊 재고량 */}
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
        {item.minStock && item.minStock > 0 && (
          <div className="text-xs text-gray-400 mt-1">
            최소: {item.minStock}개
          </div>
        )}
      </td>

      {/* 📦 입고일 */}
      <td className="px-6 py-4">
        {editing ? (
          <input
            value={form.receivedDate}
            onChange={(e) =>
              setForm((s) => ({ ...s, receivedDate: e.target.value }))
            }
            className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm"
            type="date"
          />
        ) : (
          <div>
            {item.receivedDate ? (
              <div className="text-sm text-gray-900">
                {new Date(item.receivedDate).toLocaleDateString("ko-KR")}
              </div>
            ) : (
              <div className="text-sm text-gray-400">-</div>
            )}
          </div>
        )}
      </td>

      {/* 📅 유통기한 */}
      <td className="px-6 py-4">
        {editing ? (
          <div className="space-y-1">
            <input
              value={form.expiryDate}
              onChange={(e) =>
                setForm((s) => ({ ...s, expiryDate: e.target.value }))
              }
              className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm"
              type="date"
            />
            <input
              value={form.batchNumber}
              onChange={(e) =>
                setForm((s) => ({ ...s, batchNumber: e.target.value }))
              }
              className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm"
              placeholder="로트번호"
            />
          </div>
        ) : (
          <div>
            {item.expiryDate ? (
              <div
                className={`text-sm ${
                  expiryStatus?.status !== "safe"
                    ? expiryStatus?.color.includes("red")
                      ? "text-red-600 font-medium"
                      : expiryStatus?.color.includes("orange")
                      ? "text-orange-600"
                      : "text-gray-900"
                    : "text-gray-900"
                }`}
              >
                {new Date(item.expiryDate).toLocaleDateString("ko-KR")}
              </div>
            ) : (
              <div className="text-sm text-gray-400">-</div>
            )}
            {expiryStatus && expiryStatus.status !== "safe" && (
              <div className="text-xs text-gray-500 mt-1">
                {expiryStatus.message}
              </div>
            )}
          </div>
        )}
      </td>

      {/* ⚡ 상태 */}
      <td className="px-6 py-4">
        <div className="flex flex-wrap gap-1">
          {isLowStock && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
              <AlertTriangle className="w-3 h-3 mr-1" />
              재고부족
            </span>
          )}
          {expiryStatus && expiryStatus.status !== "safe" && (
            <span
              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${expiryStatus.color}`}
            >
              <Clock className="w-3 h-3 mr-1" />
              {expiryStatus.status === "expired"
                ? "기한만료"
                : expiryStatus.status === "critical"
                ? "위험"
                : expiryStatus.status === "warning"
                ? "주의"
                : "임박"}
            </span>
          )}
          {!isLowStock && (!expiryStatus || expiryStatus.status === "safe") && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              <CheckCircle className="w-3 h-3 mr-1" />
              정상
            </span>
          )}
        </div>
      </td>

      {/* 🔧 작업 */}
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
  const hideSuccessNotification = useCallback(() => {
    if (addedId) {
      const timer = setTimeout(() => setAddedId(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [addedId]);

  useState(hideSuccessNotification);

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">인벤토리</h1>
        <p className="text-gray-600">
          상품을 등록하고 재고를 효율적으로 관리하세요
        </p>
      </div>

      {/* 성공 알림 */}
      {addedId && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
            <span className="text-green-800 font-medium">
              품목이 성공적으로 추가되었습니다! 🎉
            </span>
          </div>
          <button
            onClick={() => setAddedId(null)}
            className="text-green-600 hover:text-green-800 transition-colors"
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
                    입고일
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    유통기한
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
            <p className="text-gray-500 mb-4">
              새 품목을 추가하여 재고 관리를 시작해보세요.
            </p>
            <p className="text-xs text-gray-400">
              💡 체계적인 재고 관리로 효율성을 높여보세요
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
