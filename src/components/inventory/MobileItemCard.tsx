// src/components/inventory/MobileItemCard.tsx

import React, { useState, useCallback, useMemo } from "react";
import {
  Edit,
  Trash2,
  Settings,
  Package,
  AlertCircle,
  X,
  Check,
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

type ExpiryStatusType = "expired" | "critical" | "warning" | "near" | "safe";

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

    const hasValidValue = useCallback(
      (value: number | null | undefined): boolean => {
        return value !== null && value !== undefined && value > 0;
      },
      []
    );

    // 유통기한 임박/만료만 표시
    const shouldShowExpiry = useMemo(() => {
      if (!expiryStatus) return null;
      const criticalStatuses: ExpiryStatusType[] = [
        "expired",
        "critical",
        "warning",
      ];
      if (criticalStatuses.includes(expiryStatus.status as ExpiryStatusType)) {
        const statusMap = {
          expired: {
            label: "기한만료",
            color: "text-red-600",
            bgColor: "bg-red-50",
          },
          critical: {
            label: "임박",
            color: "text-orange-600",
            bgColor: "bg-orange-50",
          },
          warning: {
            label: "주의",
            color: "text-amber-600",
            bgColor: "bg-amber-50",
          },
        };
        return statusMap[expiryStatus.status as keyof typeof statusMap];
      }
      return null;
    }, [expiryStatus]);

    // 카테고리 정보
    const categoryInfo = useMemo(() => {
      if (!item.categoryId || !currentWorkspaceId) return null;
      const categories = getCategoriesByWorkspace(currentWorkspaceId);
      return categories.find((cat) => cat.id === item.categoryId);
    }, [item.categoryId, currentWorkspaceId, getCategoriesByWorkspace]);

    if (editing) {
      // 편집 모드
      return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-base font-semibold text-gray-900">상품 편집</h3>
          </div>

          {availableCategories.length > 0 && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                카테고리
              </label>
              <select
                value={form.categoryId}
                onChange={(e) =>
                  setForm({ ...form, categoryId: e.target.value })
                }
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg
                          text-sm text-gray-900 bg-white
                          focus:ring-2 focus:ring-blue-500 focus:border-transparent
                          transition-all"
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

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              상품명
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg
                        text-sm text-gray-900 bg-white
                        focus:ring-2 focus:ring-blue-500 focus:border-transparent
                        transition-all"
              placeholder="상품명을 입력하세요"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                SKU
              </label>
              <input
                type="text"
                value={form.sku}
                onChange={(e) =>
                  setForm((s) => ({ ...s, sku: e.target.value }))
                }
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg
                          text-sm text-gray-900 bg-white
                          focus:ring-2 focus:ring-blue-500 focus:border-transparent
                          transition-all"
                placeholder="SKU"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                바코드
              </label>
              <input
                type="text"
                value={form.barcode}
                onChange={(e) =>
                  setForm((s) => ({ ...s, barcode: e.target.value }))
                }
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg
                          text-sm text-gray-900 bg-white
                          focus:ring-2 focus:ring-blue-500 focus:border-transparent
                          transition-all"
                placeholder="바코드"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                최소재고
              </label>
              <input
                type="number"
                value={form.minStock}
                onChange={(e) =>
                  setForm((s) => ({ ...s, minStock: e.target.value }))
                }
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg
                          text-sm text-gray-900 bg-white
                          focus:ring-2 focus:ring-blue-500 focus:border-transparent
                          transition-all"
                placeholder="최소재고"
                min="1"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                가격
              </label>
              <input
                type="number"
                value={form.defaultPrice}
                onChange={(e) =>
                  setForm((s) => ({ ...s, defaultPrice: e.target.value }))
                }
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg
                          text-sm text-gray-900 bg-white
                          focus:ring-2 focus:ring-blue-500 focus:border-transparent
                          transition-all"
                placeholder="가격"
                step="0.01"
                min="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                입고일
              </label>
              <input
                type="date"
                value={form.receivedDate}
                onChange={(e) =>
                  setForm((s) => ({ ...s, receivedDate: e.target.value }))
                }
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg
                          text-sm text-gray-900 bg-white
                          focus:ring-2 focus:ring-blue-500 focus:border-transparent
                          transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                유통기한
              </label>
              <input
                type="date"
                value={form.expiryDate}
                onChange={(e) =>
                  setForm((s) => ({ ...s, expiryDate: e.target.value }))
                }
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg
                          text-sm text-gray-900 bg-white
                          focus:ring-2 focus:ring-blue-500 focus:border-transparent
                          transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              로트번호
            </label>
            <input
              type="text"
              value={form.batchNumber}
              onChange={(e) =>
                setForm((s) => ({ ...s, batchNumber: e.target.value }))
              }
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg
                        text-sm text-gray-900 bg-white
                        focus:ring-2 focus:ring-blue-500 focus:border-transparent
                        transition-all"
              placeholder="로트번호"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={save}
              className="flex-1 flex items-center justify-center gap-2 h-11
                        text-white bg-blue-600 rounded-lg font-medium text-sm
                        hover:bg-blue-700 active:bg-blue-800
                        transition-colors touch-manipulation"
            >
              <Check className="w-4 h-4" />
              저장
            </button>
            <button
              onClick={handleCancel}
              className="flex-1 flex items-center justify-center gap-2 h-11
                        text-gray-700 bg-gray-100 rounded-lg font-medium text-sm
                        hover:bg-gray-200 active:bg-gray-300
                        transition-colors touch-manipulation"
            >
              <X className="w-4 h-4" />
              취소
            </button>
          </div>
        </div>
      );
    }

    // 표시 모드 - 심플하고 담백한 디자인
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* 헤더 영역 */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex gap-3 items-center">
            {/* 좌측: 상품 이미지 영역 (추후 이미지 추가용) */}
            <div className="flex-shrink-0 w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center">
              {/* item.imageUrl이 있으면 <img src={item.imageUrl} /> 사용 */}
              <Package className="w-7 h-7 text-gray-400" />
            </div>

            {/* 우측: 상품 정보 */}
            <div className="flex-1 min-w-0">
              {/* 카테고리 */}
              {categoryInfo && (
                <div className="text-xs text-gray-500 mb-1">
                  {categoryInfo.icon && (
                    <span className="mr-1">{categoryInfo.icon}</span>
                  )}
                  {categoryInfo.name}
                </div>
              )}

              {/* 상품명 */}
              <h3 className="text-base font-semibold text-gray-900 line-clamp-2">
                {item.name}
              </h3>

              {/* 경고 배지 - 재고부족이나 유통기한 임박시에만 표시 */}
              {(isLowStock || shouldShowExpiry) && (
                <div className="flex flex-wrap gap-1.5 mt-1 ">
                  {isLowStock && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium text-red-600 bg-red-50">
                      <AlertCircle className="w-3 h-3" />
                      재고부족
                    </span>
                  )}
                  {shouldShowExpiry && (
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${shouldShowExpiry.color} ${shouldShowExpiry.bgColor}`}
                    >
                      {shouldShowExpiry.label}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 재고 정보 영역 */}
        <div className="px-4 py-3 bg-slate-50">
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-sm text-gray-600">현재 재고</span>
              <span className="text-2xl font-bold text-gray-900">
                {stock.toLocaleString()}
              </span>
              <span className="text-sm text-gray-500">개</span>
            </div>

            {hasValidValue(item.minStock) && (
              <div className="text-right">
                <div className="text-xs text-gray-500">
                  최소 {item.minStock?.toLocaleString()}개
                </div>
                {isLowStock && (
                  <div className="text-xs font-medium text-red-600 mt-0.5">
                    {(item.minStock! - stock).toLocaleString()}개 부족
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 상세 정보 영역 */}
        <div className="p-4 space-y-3">
          {/* 판매가 */}
          {hasValidValue(item.defaultPrice) && (
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <span>판매가</span>
              </div>
              <span className="font-semibold text-gray-900">
                {item.defaultPrice!.toLocaleString()}원
              </span>
            </div>
          )}

          {/* 유통기한 */}
          {item.expiryDate && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">유통기한</span>
              <span className="font-medium text-gray-900">
                {new Date(item.expiryDate).toLocaleDateString("ko-KR")}
              </span>
            </div>
          )}

          {/* 기타 정보 - 있을 경우에만 표시 */}
          {(item.sku || item.receivedDate || item.batchNumber) && (
            <div className="pt-3 border-t border-gray-100 space-y-2">
              {item.sku && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">SKU</span>
                  <span className="font-mono text-gray-700">{item.sku}</span>
                </div>
              )}
              {item.receivedDate && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">입고일</span>
                  <span className="text-gray-700">
                    {new Date(item.receivedDate).toLocaleDateString("ko-KR")}
                  </span>
                </div>
              )}
              {item.batchNumber && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">로트번호</span>
                  <span className="font-mono text-gray-700">
                    {item.batchNumber}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 액션 버튼 영역 */}
        <div className="p-4 bg-gray-50 border-t border-gray-100">
          <div className="flex gap-2">
            <button
              onClick={() => setEditing(true)}
              className="flex-1 flex items-center justify-center gap-2 h-10
                        text-blue-600 bg-white rounded-lg font-medium text-sm
                        border border-blue-200 hover:bg-blue-50
                        transition-colors touch-manipulation"
            >
              <Edit className="w-4 h-4" />
              수정
            </button>
            <button
              onClick={onAdjust}
              className="flex-1 flex items-center justify-center gap-2 h-10
                        text-green-600 bg-white rounded-lg font-medium text-sm
                        border border-green-200 hover:bg-green-50
                        transition-colors touch-manipulation"
            >
              <Settings className="w-4 h-4" />
              조정
            </button>
            <button
              onClick={onDelete}
              className="flex-1 flex items-center justify-center gap-2 h-10
                        text-red-600 bg-white rounded-lg font-medium text-sm
                        border border-red-200 hover:bg-red-50
                        transition-colors touch-manipulation"
            >
              <Trash2 className="w-4 h-4" />
              삭제
            </button>
          </div>
        </div>
      </div>
    );
  }
);

MobileItemCard.displayName = "MobileItemCard";
