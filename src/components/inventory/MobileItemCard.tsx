import React, { useState, useCallback, useMemo } from "react";
import {
  Edit,
  Trash2,
  Settings,
  X,
  Calendar,
  DollarSign,
  TrendingDown,
  AlertTriangle,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { useStockByItem } from "@/stores/selectors";
import { getExpiryStatus } from "@/utils/expiryUtils";
import { type Item } from "@/stores/itemsStore";
import { useCategoriesStore } from "@/stores/categoriesStore";
import { useWorkspaceStore } from "@/stores/workspaceStore";

interface MobileItemCardProps {
  item: Item;
  onEdit: (patch: Partial<Item>) => void;
  onDelete: () => void;
  onAdjust: () => void;
}

export const MobileItemCard: React.FC<MobileItemCardProps> = React.memo(
  ({ item, onEdit, onDelete, onAdjust }) => {
    const stock = useStockByItem(item.id);
    const currentWorkspaceId = useWorkspaceStore((s) => s.currentWorkspaceId);
    const { getCategoriesByWorkspace } = useCategoriesStore();
    const [editing, setEditing] = useState(false);

    const [form, setForm] = useState({
      name: item.name,
      sku: item.sku ?? "",
      barcode: item.barcode ?? "",
      minStock:
        item.minStock !== null &&
        item.minStock !== undefined &&
        item.minStock > 0
          ? item.minStock.toString()
          : "",
      defaultPrice:
        item.defaultPrice !== null &&
        item.defaultPrice !== undefined &&
        item.defaultPrice > 0
          ? item.defaultPrice.toString()
          : "",
      expiryDate: item.expiryDate ?? "",
      batchNumber: item.batchNumber ?? "",
      receivedDate: item.receivedDate ?? "",
      categoryId: item.categoryId ?? "",
    });

    const availableCategories = useMemo(() => {
      if (!currentWorkspaceId) return [];
      return getCategoriesByWorkspace(currentWorkspaceId);
    }, [currentWorkspaceId, getCategoriesByWorkspace]);

    const expiryStatus = useMemo(() => {
      return item.expiryDate ? getExpiryStatus(item.expiryDate) : null;
    }, [item.expiryDate]);

    const save = useCallback(() => {
      const minStockValue = form.minStock.trim();
      const minStockNum =
        minStockValue && Number(minStockValue) > 0
          ? Number(minStockValue)
          : undefined;

      const defaultPriceValue = form.defaultPrice.trim();
      const defaultPriceNum =
        defaultPriceValue && Number(defaultPriceValue) > 0
          ? Number(defaultPriceValue)
          : undefined;

      onEdit({
        name: form.name,
        sku: form.sku || undefined,
        barcode: form.barcode || undefined,
        minStock: minStockNum,
        defaultPrice: defaultPriceNum,
        expiryDate: form.expiryDate || undefined,
        batchNumber: form.batchNumber || undefined,
        receivedDate: form.receivedDate || undefined,
        categoryId: form.categoryId || undefined,
      });
      setEditing(false);
    }, [onEdit, form]);

    const handleCancel = useCallback(() => {
      setEditing(false);
      setForm({
        name: item.name,
        sku: item.sku ?? "",
        barcode: item.barcode ?? "",
        minStock:
          item.minStock !== null &&
          item.minStock !== undefined &&
          item.minStock > 0
            ? item.minStock.toString()
            : "",
        defaultPrice:
          item.defaultPrice !== null &&
          item.defaultPrice !== undefined &&
          item.defaultPrice > 0
            ? item.defaultPrice.toString()
            : "",
        expiryDate: item.expiryDate ?? "",
        batchNumber: item.batchNumber ?? "",
        receivedDate: item.receivedDate ?? "",
        categoryId: item.categoryId ?? "",
      });
    }, [item]);

    const isLowStock = useMemo(() => {
      return (
        item.minStock !== null &&
        item.minStock !== undefined &&
        item.minStock > 0 &&
        stock <= item.minStock
      );
    }, [item.minStock, stock]);

    const primaryStatus = useMemo(() => {
      if (expiryStatus?.status === "expired")
        return {
          type: "expired",
          label: "기한만료",
          color: "bg-red-500 text-white",
          bgColor: "bg-red-50",
          icon: X,
        };

      if (isLowStock)
        return {
          type: "lowStock",
          label: "재고부족",
          color: "bg-red-500 text-white",
          bgColor: "bg-red-50",
          icon: TrendingDown,
        };

      if (expiryStatus?.status === "critical")
        return {
          type: "critical",
          label: "위험",
          color: "bg-red-500 text-white",
          bgColor: "bg-red-50",
          icon: AlertTriangle,
        };

      if (expiryStatus?.status === "warning")
        return {
          type: "warning",
          label: "주의",
          color: "bg-orange-500 text-white",
          bgColor: "bg-orange-50",
          icon: Clock,
        };

      if (expiryStatus?.status === "near")
        return {
          type: "near",
          label: "임박",
          color: "bg-amber-500 text-white",
          bgColor: "bg-amber-50",
          icon: Clock,
        };

      return {
        type: "normal",
        label: "정상",
        color: "bg-green-500 text-white",
        bgColor: "bg-green-50",
        icon: CheckCircle2,
      };
    }, [expiryStatus, isLowStock]);

    const StatusIcon = primaryStatus.icon;

    return (
      <div className="bg-white rounded-xl overflow-hidden transition-all duration-200 hover:shadow-md">
        {editing ? (
          /* 편집 모드 */
          <div className="p-6">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-1">
                상품 정보 수정
              </h3>
              <p className="text-sm text-gray-600">
                상품 정보를 업데이트하세요
              </p>
            </div>

            <div className="space-y-5">
              {availableCategories.length > 0 && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    카테고리
                  </label>
                  <select
                    value={form.categoryId}
                    onChange={(e) =>
                      setForm({ ...form, categoryId: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white appearance-none text-sm font-medium"
                  >
                    <option value="">카테고리 선택</option>
                    {availableCategories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.icon && `${category.icon} `}
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  상품명
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, name: e.target.value }))
                  }
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium"
                  placeholder="상품명을 입력하세요"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    SKU
                  </label>
                  <input
                    type="text"
                    value={form.sku}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, sku: e.target.value }))
                    }
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="SKU-001"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    바코드
                  </label>
                  <input
                    type="text"
                    value={form.barcode}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, barcode: e.target.value }))
                    }
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="1234567890"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    최소재고
                  </label>
                  <input
                    type="number"
                    value={form.minStock}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, minStock: e.target.value }))
                    }
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="최소재고 (선택)"
                    min="1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    가격
                  </label>
                  <input
                    type="number"
                    value={form.defaultPrice}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, defaultPrice: e.target.value }))
                    }
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="가격"
                    step="0.01"
                    min="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    입고일
                  </label>
                  <input
                    type="date"
                    value={form.receivedDate}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, receivedDate: e.target.value }))
                    }
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    유통기한
                  </label>
                  <input
                    type="date"
                    value={form.expiryDate}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, expiryDate: e.target.value }))
                    }
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  로트번호
                </label>
                <input
                  type="text"
                  value={form.batchNumber}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, batchNumber: e.target.value }))
                  }
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="로트번호"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={save}
                className="flex-1 bg-blue-600 text-white font-semibold py-3 px-4 rounded-xl hover:bg-blue-700 transition-colors"
              >
                저장
              </button>
              <button
                onClick={handleCancel}
                className="flex-1 bg-gray-100 text-gray-700 font-semibold py-3 px-4 rounded-xl hover:bg-gray-200 transition-colors"
              >
                취소
              </button>
            </div>
          </div>
        ) : (
          /* 표시 모드 */
          <div className="relative">
            {/* 상태 배지 */}
            <div
              className={`absolute top-0 right-0 ${primaryStatus.bgColor} p-3`}
            >
              <div
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${primaryStatus.color}`}
              >
                <StatusIcon className="w-3 h-3" />
                {primaryStatus.label}
              </div>
            </div>

            <div className="p-6">
              {/* 상품 정보 헤더 */}
              <div className="pr-20 mb-4">
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  {item.name}
                </h3>
                {(item.sku || item.barcode) && (
                  <div className="flex flex-wrap gap-3 text-xs text-gray-600">
                    {item.sku && (
                      <span className="bg-gray-100 px-2.5 py-1 rounded-md font-medium">
                        SKU: {item.sku}
                      </span>
                    )}
                    {item.barcode && (
                      <span className="bg-gray-100 px-2.5 py-1 rounded-md font-medium">
                        바코드: {item.barcode}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* 재고량 표시 */}
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-2xl font-bold text-gray-900">
                  {stock}
                </span>
                <span className="text-sm text-gray-600">개</span>
                {item.minStock !== null &&
                  item.minStock !== undefined &&
                  item.minStock > 0 && (
                    <span className="text-xs text-gray-500 ml-2">
                      최소 재고 {item.minStock}개
                    </span>
                  )}
              </div>

              {/* 상세 정보 */}
              <div className="space-y-3">
                {item.expiryDate && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">유통기한</span>
                    <span className="font-medium text-gray-900">
                      {new Date(item.expiryDate).toLocaleDateString("ko-KR")}
                    </span>
                  </div>
                )}

                {item.defaultPrice && (
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">가격</span>
                    <span className="font-medium text-gray-900">
                      {item.defaultPrice.toLocaleString()}원
                    </span>
                  </div>
                )}

                {(item.receivedDate || item.batchNumber) && (
                  <div className="space-y-2">
                    {item.receivedDate && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span>입고일:</span>
                        <span className="font-medium">
                          {new Date(item.receivedDate).toLocaleDateString(
                            "ko-KR"
                          )}
                        </span>
                      </div>
                    )}
                    {item.batchNumber && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span>로트번호:</span>
                        <span className="font-medium">{item.batchNumber}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 액션 버튼들 */}
              <div className="grid grid-cols-3 gap-2 mt-6">
                <button
                  onClick={() => setEditing(true)}
                  className="flex flex-col items-center justify-center p-3 text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200 group"
                >
                  <Edit className="w-5 h-5 mb-1 group-hover:scale-105 transition-transform" />
                  <span className="text-xs font-medium">수정</span>
                </button>

                <button
                  onClick={onAdjust}
                  className="flex flex-col items-center justify-center p-3 text-green-600 hover:bg-green-50 rounded-xl transition-all duration-200 group"
                >
                  <Settings className="w-5 h-5 mb-1 group-hover:scale-105 transition-transform" />
                  <span className="text-xs font-medium">조정</span>
                </button>

                <button
                  onClick={onDelete}
                  className="flex flex-col items-center justify-center p-3 text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 group"
                >
                  <Trash2 className="w-5 h-5 mb-1 group-hover:scale-105 transition-transform" />
                  <span className="text-xs font-medium">삭제</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
);

MobileItemCard.displayName = "MobileItemCard";
