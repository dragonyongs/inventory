import { useMemo, useState, useCallback } from "react";
import {
  Package,
  AlertTriangle,
  Clock,
  Edit,
  Trash2,
  Settings,
  CheckCircle,
  X,
} from "lucide-react";

import { useStockByItem } from "@/stores/selectors";
import { type Item } from "@/stores/itemsStore";
import { getExpiryStatus } from "@/utils/expiryUtils";

// ItemRow 컴포넌트 (기존 로직 유지)
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
      {/* 상품 정보 */}
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

      {/* 재고량 */}
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

      {/* 입고일 */}
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

      {/* 유통기한 */}
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

      {/* 상태 */}
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

      {/* 작업 */}
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

// 메인 InventoryTable 컴포넌트
interface InventoryTableProps {
  items: Item[];
  onEdit: (id: string, patch: Partial<Item>) => void;
  onDelete: (id: string) => void;
  onAdjust: (id: string) => void;
}

export default function InventoryTable({
  items,
  onEdit,
  onDelete,
  onAdjust,
}: InventoryTableProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Package className="w-5 h-5 mr-2 text-blue-600" />
            품목 목록
          </h3>
          <span className="text-sm text-gray-500">
            총 {items.length}개 품목
          </span>
        </div>
      </div>

      {items.length > 0 ? (
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
              {items.map((item) => (
                <ItemRow
                  key={item.id}
                  item={item}
                  onEdit={(patch) => onEdit(item.id, patch)}
                  onDelete={() => onDelete(item.id)}
                  onAdjust={() => onAdjust(item.id)}
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
  );
}
