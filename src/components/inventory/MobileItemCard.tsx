// src/components/inventory/MobileItemCard.tsx
import React, { useState, useCallback, useMemo } from "react";
import {
  Edit,
  Trash2,
  Settings,
  Package,
  TrendingDown,
  TrendingUp,
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

// 유통기한 상태 타입 정의
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

    // 값이 유효한지 확인하는 헬퍼 함수
    const hasValidValue = useCallback(
      (value: number | null | undefined): boolean => {
        return value !== null && value !== undefined && value > 0;
      },
      []
    );

    // 재고 상태 정보
    const stockInfo = useMemo(() => {
      if (!hasValidValue(item.minStock)) {
        return {
          status: "normal",
          label: "정상",
          textColor: "text-gray-700",
          bulletColor: "bg-green-500",
        };
      }

      if (isLowStock) {
        return {
          status: "low",
          label: "재고부족",
          textColor: "text-red-600",
          bulletColor: "bg-red-500",
        };
      }

      return {
        status: "sufficient",
        label: "충분",
        textColor: "text-blue-600",
        bulletColor: "bg-green-500",
      };
    }, [isLowStock, item.minStock, hasValidValue]);

    // ✅ 타입 에러 수정: 명시적 타입 지정
    const expiryInfo = useMemo(() => {
      if (!expiryStatus) return null;

      const statusMap: Record<
        ExpiryStatusType,
        { label: string; color: string; bulletColor: string }
      > = {
        expired: {
          label: "기한만료",
          color: "text-red-600",
          bulletColor: "bg-red-500",
        },
        critical: {
          label: "임박",
          color: "text-orange-600",
          bulletColor: "bg-orange-500",
        },
        warning: {
          label: "주의",
          color: "text-amber-600",
          bulletColor: "bg-amber-500",
        },
        near: {
          label: "양호",
          color: "text-blue-600",
          bulletColor: "bg-blue-500",
        },
        safe: {
          label: "안전",
          color: "text-gray-600",
          bulletColor: "bg-gray-400",
        },
      };

      return statusMap[expiryStatus.status as ExpiryStatusType];
    }, [expiryStatus]);

    return (
      <div className="bg-white border-b border-gray-100 last:border-b-0">
        {editing ? (
          /* 편집 모드 */
          <div className="p-5 space-y-4">
            {availableCategories.length > 0 && (
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  카테고리
                </label>
                <select
                  value={form.categoryId}
                  onChange={(e) =>
                    setForm({ ...form, categoryId: e.target.value })
                  }
                  className="w-full px-4 py-3 border-0 bg-gray-50 rounded-lg 
                           text-base font-medium text-gray-900
                           focus:ring-2 focus:ring-blue-500 focus:bg-white
                           transition-all duration-200"
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
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                상품명
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) =>
                  setForm((s) => ({ ...s, name: e.target.value }))
                }
                className="w-full px-4 py-3 border-0 bg-gray-50 rounded-lg 
                         text-base font-medium text-gray-900
                         focus:ring-2 focus:ring-blue-500 focus:bg-white
                         transition-all duration-200"
                placeholder="상품명을 입력하세요"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  SKU
                </label>
                <input
                  type="text"
                  value={form.sku}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, sku: e.target.value }))
                  }
                  className="w-full px-4 py-3 border-0 bg-gray-50 rounded-lg 
                           text-sm font-medium text-gray-900
                           focus:ring-2 focus:ring-blue-500 focus:bg-white
                           transition-all duration-200"
                  placeholder="SKU"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  바코드
                </label>
                <input
                  type="text"
                  value={form.barcode}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, barcode: e.target.value }))
                  }
                  className="w-full px-4 py-3 border-0 bg-gray-50 rounded-lg 
                           text-sm font-medium text-gray-900
                           focus:ring-2 focus:ring-blue-500 focus:bg-white
                           transition-all duration-200"
                  placeholder="바코드"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  최소재고
                </label>
                <input
                  type="number"
                  value={form.minStock}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, minStock: e.target.value }))
                  }
                  className="w-full px-4 py-3 border-0 bg-gray-50 rounded-lg 
                           text-sm font-medium text-gray-900
                           focus:ring-2 focus:ring-blue-500 focus:bg-white
                           transition-all duration-200"
                  placeholder="최소재고"
                  min="1"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  가격
                </label>
                <input
                  type="number"
                  value={form.defaultPrice}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, defaultPrice: e.target.value }))
                  }
                  className="w-full px-4 py-3 border-0 bg-gray-50 rounded-lg 
                           text-sm font-medium text-gray-900
                           focus:ring-2 focus:ring-blue-500 focus:bg-white
                           transition-all duration-200"
                  placeholder="가격"
                  step="0.01"
                  min="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  입고일
                </label>
                <input
                  type="date"
                  value={form.receivedDate}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, receivedDate: e.target.value }))
                  }
                  className="w-full px-4 py-3 border-0 bg-gray-50 rounded-lg 
                           text-sm font-medium text-gray-900
                           focus:ring-2 focus:ring-blue-500 focus:bg-white
                           transition-all duration-200"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  유통기한
                </label>
                <input
                  type="date"
                  value={form.expiryDate}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, expiryDate: e.target.value }))
                  }
                  className="w-full px-4 py-3 border-0 bg-gray-50 rounded-lg 
                           text-sm font-medium text-gray-900
                           focus:ring-2 focus:ring-blue-500 focus:bg-white
                           transition-all duration-200"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                로트번호
              </label>
              <input
                type="text"
                value={form.batchNumber}
                onChange={(e) =>
                  setForm((s) => ({ ...s, batchNumber: e.target.value }))
                }
                className="w-full px-4 py-3 border-0 bg-gray-50 rounded-lg 
                         text-sm font-medium text-gray-900
                         focus:ring-2 focus:ring-blue-500 focus:bg-white
                         transition-all duration-200"
                placeholder="로트번호"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={save}
                className="flex-1 h-11 bg-blue-600 text-white rounded-xl 
                         text-base font-bold
                         hover:bg-blue-700 active:bg-blue-800 
                         transition-colors duration-200
                         touch-manipulation"
              >
                저장
              </button>
              <button
                onClick={handleCancel}
                className="flex-1 h-11 bg-gray-100 text-gray-700 rounded-xl 
                         text-base font-bold
                         hover:bg-gray-200 active:bg-gray-300 
                         transition-colors duration-200
                         touch-manipulation"
              >
                취소
              </button>
            </div>
          </div>
        ) : (
          /* 표시 모드 - 기존 모던 디자인 유지 */
          <div className="p-5">
            {/* ✅ 상태 배지 - 블릿 스타일로 복원 */}
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${stockInfo.bulletColor}`}
                />
                <span className="text-xs font-bold text-gray-900">
                  {stockInfo.label}
                </span>
              </div>
              {expiryInfo && (
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${expiryInfo.bulletColor}`}
                  />
                  <span className={`text-xs font-bold ${expiryInfo.color}`}>
                    {expiryInfo.label}
                  </span>
                </div>
              )}
            </div>

            {/* 상품명 */}
            <h3 className="text-lg font-bold text-gray-900 mb-1 leading-snug">
              {item.name}
            </h3>

            {/* 재고 현황 - 토스 스타일 */}
            <div className="bg-gray-50 rounded-2xl p-5 mb-4 mt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center shadow-sm">
                    <Package className="w-5 h-5 text-gray-700" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium mb-0.5">
                      현재 재고
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stock}
                      <span className="text-base text-gray-500 font-semibold ml-1">
                        개
                      </span>
                    </p>
                  </div>
                </div>

                {hasValidValue(item.minStock) && (
                  <div className="text-right">
                    <p className="text-xs text-gray-500 font-medium mb-1">
                      최소 재고 {item.minStock}개
                    </p>
                    {isLowStock ? (
                      <div
                        className={`flex items-center gap-1 justify-end ${stockInfo.textColor}`}
                      >
                        <TrendingDown className="w-4 h-4" />
                        <span className="text-sm font-bold">
                          {item.minStock! - stock}개 부족
                        </span>
                      </div>
                    ) : (
                      <div
                        className={`flex items-center gap-1 justify-end ${stockInfo.textColor}`}
                      >
                        <TrendingUp className="w-4 h-4" />
                        <span className="text-sm font-bold">충분</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* 추가 정보 */}
            {(item.expiryDate || hasValidValue(item.defaultPrice)) && (
              <div className="space-y-2 mb-4">
                {item.expiryDate && (
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-gray-600 font-medium">
                      유통기한
                    </span>
                    <span className="text-sm text-gray-900 font-semibold">
                      {new Date(item.expiryDate).toLocaleDateString("ko-KR")}
                    </span>
                  </div>
                )}
                {hasValidValue(item.defaultPrice) && (
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-gray-600 font-medium">
                      가격
                    </span>
                    <span className="text-sm text-gray-900 font-semibold">
                      {item.defaultPrice!.toLocaleString()}원
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* 입고일 */}
            {item.receivedDate && (
              <div className="text-xs text-gray-500 font-medium mb-4">
                입고일:{" "}
                {new Date(item.receivedDate).toLocaleDateString("ko-KR")}
              </div>
            )}

            {/* ✅ 액션 버튼 - 기존 모던 디자인 복원 */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setEditing(true)}
                className="flex-1 flex items-center justify-center gap-2 h-11
                         text-blue-600 bg-blue-50 rounded-lg font-semibold text-sm
                         hover:bg-blue-100 active:bg-blue-200
                         transition-colors duration-200 touch-manipulation"
              >
                <Edit className="w-4 h-4" />
                수정
              </button>

              <button
                onClick={onAdjust}
                className="flex-1 flex items-center justify-center gap-2 h-11
                         text-green-600 bg-green-50 rounded-lg font-semibold text-sm
                         hover:bg-green-100 active:bg-green-200
                         transition-colors duration-200 touch-manipulation"
              >
                <Settings className="w-4 h-4" />
                조정
              </button>

              <button
                onClick={onDelete}
                className="flex-1 flex items-center justify-center gap-2 h-11
                         text-red-600 bg-red-50 rounded-lg font-semibold text-sm
                         hover:bg-red-100 active:bg-red-200
                         transition-colors duration-200 touch-manipulation"
              >
                <Trash2 className="w-4 h-4" />
                삭제
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }
);

MobileItemCard.displayName = "MobileItemCard";
