// src/components/inventory/ItemRow.tsx
import React, { useState, useCallback, useMemo } from "react";
import ReactDOM from "react-dom"; // ✅ Portal 추가
import { useStockByItem } from "@/stores/selectors";
import { getExpiryStatus } from "@/utils/expiryUtils";
import { type Item } from "@/stores/itemsStore";
import { useCategoriesStore } from "@/stores/categoriesStore";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { ItemActions } from "./ItemActions";
import { Image, Camera, ChevronDown } from "lucide-react";
import { ImageGalleryModal } from "./ImageGalleryModal";
import { useItemsStore } from "@/stores/itemsStore";
import type { ItemImage } from "@/types/image";

interface ItemRowProps {
  item: Item;
  onEdit: (patch: Partial<Item>) => void;
  onDelete: () => void;
  onAdjust: () => void;
}

export const ItemRow: React.FC<ItemRowProps> = React.memo(
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
        item.minStock && item.minStock > 0 ? item.minStock.toString() : "",
      defaultPrice: item.defaultPrice ?? "",
      expiryDate: item.expiryDate ?? "",
      batchNumber: item.batchNumber ?? "",
      receivedDate: item.receivedDate ?? "",
      categoryId: item.categoryId ?? "",
    });

    const [isGalleryOpen, setIsGalleryOpen] = useState(false);

    const { addImageToItem, removeImageFromItem, setPrimaryImage } =
      useItemsStore();

    const availableCategories = useMemo(() => {
      if (!currentWorkspaceId) return [];
      return getCategoriesByWorkspace(currentWorkspaceId);
    }, [currentWorkspaceId, getCategoriesByWorkspace]);

    const expiryStatus = useMemo(() => {
      return item.expiryDate ? getExpiryStatus(item.expiryDate) : null;
    }, [item.expiryDate]);

    const save = useCallback(() => {
      const minStockValue = form.minStock.trim();
      const minStockNum = minStockValue ? Number(minStockValue) : null;

      onEdit({
        name: form.name,
        sku: form.sku || undefined,
        barcode: form.barcode || undefined,
        minStock: minStockNum && minStockNum > 0 ? minStockNum : undefined,
        defaultPrice:
          typeof form.defaultPrice === "number" ? form.defaultPrice : undefined,
        expiryDate: form.expiryDate || undefined,
        batchNumber: form.batchNumber || undefined,
        receivedDate: form.receivedDate || undefined,
        categoryId: form.categoryId || undefined,
      });

      setEditing(false);
    }, [onEdit, form]);

    const handleImageUploaded = useCallback(
      (image: ItemImage) => {
        addImageToItem(item.id, image);
      },
      [item.id, addImageToItem]
    );

    const handleImageDeleted = useCallback(
      (imageId: string) => {
        removeImageFromItem(item.id, imageId);
      },
      [item.id, removeImageFromItem]
    );

    const handleSetPrimaryImage = useCallback(
      (imageId: string) => {
        setPrimaryImage(item.id, imageId);
      },
      [item.id, setPrimaryImage]
    );

    const handleThumbnailClick = useCallback(() => {
      setIsGalleryOpen(true);
    }, []);

    const handleCancel = useCallback(() => {
      setEditing(false);
      setForm({
        name: item.name,
        sku: item.sku ?? "",
        barcode: item.barcode ?? "",
        minStock:
          item.minStock && item.minStock > 0 ? item.minStock.toString() : "",
        defaultPrice: item.defaultPrice ?? "",
        expiryDate: item.expiryDate ?? "",
        batchNumber: item.batchNumber ?? "",
        receivedDate: item.receivedDate ?? "",
        categoryId: item.categoryId ?? "",
      });
    }, [item]);

    const handleEdit = useCallback(() => {
      setEditing(true);
    }, []);

    const isLowStock =
      typeof item.minStock === "number" &&
      item.minStock > 0 &&
      stock <= item.minStock;

    const hasImages = item.images && item.images.length > 0;

    return (
      <>
        <tr
          className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
            editing ? "bg-blue-50" : ""
          }`}
        >
          {/* 이미지 썸네일 */}
          <td className="px-4 py-3 w-20">
            {hasImages ? (
              <button
                onClick={handleThumbnailClick}
                className="relative group"
                type="button"
              >
                <img
                  src={item.thumbnailUrl || item.images![0].directUrl}
                  alt={item.name}
                  className="w-14 h-14 object-cover rounded-lg border border-gray-200 group-hover:border-blue-400 transition-colors"
                  loading="lazy"
                />
                {item.images!.length > 1 && (
                  <div className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-medium">
                    {item.images!.length}
                  </div>
                )}
                <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-30 rounded-lg transition-all flex items-center justify-center">
                  <Camera className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </button>
            ) : editing ? (
              <button
                onClick={handleThumbnailClick}
                className="w-14 h-14 flex items-center justify-center bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50 transition-colors group"
                type="button"
              >
                <Camera className="w-6 h-6 text-gray-400 group-hover:text-blue-500 transition-colors" />
              </button>
            ) : (
              <div className="w-14 h-14 flex items-center justify-center bg-gray-100 rounded-lg border border-gray-200">
                <Image className="w-6 h-6 text-gray-400" />
              </div>
            )}
          </td>

          {/* 상품 정보 */}
          <td className="px-4 py-3 min-w-[280px]">
            {editing ? (
              <div className="space-y-2">
                <div className="relative">
                  <select
                    value={form.categoryId}
                    onChange={(e) =>
                      setForm({ ...form, categoryId: e.target.value })
                    }
                    className="w-full px-3 py-2 pr-10 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white appearance-none cursor-pointer"
                  >
                    <option value="">카테고리 선택</option>
                    {availableCategories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.icon && `${category.icon} `}
                        {category.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>

                <input
                  type="text"
                  value={form.name}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, name: e.target.value }))
                  }
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium text-sm"
                  placeholder="상품명"
                />

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={form.sku}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, sku: e.target.value }))
                    }
                    className="flex-1 px-2 py-1 bg-white border border-gray-200 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="SKU"
                  />
                  <input
                    type="text"
                    value={form.barcode}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, barcode: e.target.value }))
                    }
                    className="flex-1 px-2 py-1 bg-white border border-gray-200 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="바코드"
                  />
                </div>
              </div>
            ) : (
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 truncate">
                  {item.name}
                </div>
                <div className="flex flex-wrap gap-2 mt-1 text-xs text-gray-500">
                  {item.sku && (
                    <span className="bg-gray-100 px-2 py-0.5 rounded">
                      SKU: {item.sku}
                    </span>
                  )}
                  {item.barcode && (
                    <span className="bg-gray-100 px-2 py-0.5 rounded">
                      바코드: {item.barcode}
                    </span>
                  )}
                </div>
                {(item.defaultPrice || item.batchNumber) && (
                  <div className="flex flex-wrap gap-2 mt-1 text-xs text-gray-600">
                    {item.defaultPrice && (
                      <span className="text-green-600 font-medium">
                        가격: {item.defaultPrice.toLocaleString()}원
                      </span>
                    )}
                    {item.batchNumber && (
                      <span className="text-gray-500">
                        로트: {item.batchNumber}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
          </td>

          {/* 재고량 */}
          <td className="px-4 py-3 text-center w-28">
            {editing ? (
              <input
                type="number"
                min="0"
                value={form.minStock}
                onChange={(e) =>
                  setForm((s) => ({ ...s, minStock: e.target.value }))
                }
                className="w-20 px-2 py-1 bg-white border border-gray-200 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm text-right"
                placeholder="최소"
              />
            ) : (
              <>
                <div className="font-medium text-gray-900">{stock}개</div>
                {typeof item.minStock === "number" && item.minStock > 0 && (
                  <div className="text-xs text-gray-500 mt-0.5">
                    최소: {item.minStock}개
                  </div>
                )}
              </>
            )}
          </td>

          {/* 입고일 */}
          <td className="px-4 py-3 text-center w-36">
            {editing ? (
              <input
                type="date"
                value={form.receivedDate}
                onChange={(e) =>
                  setForm((s) => ({ ...s, receivedDate: e.target.value }))
                }
                className="w-full px-2 py-1 bg-white border border-gray-200 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            ) : (
              <span className="text-sm text-gray-700">
                {item.receivedDate
                  ? new Date(item.receivedDate).toLocaleDateString("ko-KR")
                  : "-"}
              </span>
            )}
          </td>

          {/* 유통기한 */}
          <td className="px-4 py-3 text-center w-36">
            {editing ? (
              <div className="space-y-1">
                <input
                  type="date"
                  value={form.expiryDate}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, expiryDate: e.target.value }))
                  }
                  className="w-full px-2 py-1 bg-white border border-gray-200 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm"
                />
                <input
                  type="text"
                  value={form.batchNumber}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, batchNumber: e.target.value }))
                  }
                  className="w-full px-2 py-1 bg-white border border-gray-200 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="로트번호"
                />
              </div>
            ) : (
              <span className="text-sm text-gray-700">
                {item.expiryDate
                  ? new Date(item.expiryDate).toLocaleDateString("ko-KR")
                  : "-"}
              </span>
            )}
          </td>

          {/* 상태 */}
          <td className="px-4 py-3 text-center w-28">
            {isLowStock && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                재고부족
              </span>
            )}
            {expiryStatus && expiryStatus.status !== "safe" && (
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  expiryStatus.status === "expired"
                    ? "bg-gray-100 text-gray-800"
                    : expiryStatus.status === "critical"
                    ? "bg-red-100 text-red-800"
                    : expiryStatus.status === "warning"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-orange-100 text-orange-800"
                }`}
              >
                {expiryStatus.status === "expired"
                  ? "기한만료"
                  : expiryStatus.status === "critical"
                  ? "위험"
                  : expiryStatus.status === "warning"
                  ? "주의"
                  : "임박"}
              </span>
            )}
            {!isLowStock &&
              (!expiryStatus || expiryStatus.status === "safe") && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  정상
                </span>
              )}
          </td>

          {/* 작업 */}
          <td className="px-4 py-3 w-40">
            <ItemActions
              editing={editing}
              onEdit={handleEdit}
              onSave={save}
              onCancel={handleCancel}
              onDelete={onDelete}
              onAdjust={onAdjust}
            />
          </td>
        </tr>

        {/* ✅ Portal을 사용하여 모달을 document.body에 렌더링 */}
        {isGalleryOpen &&
          ReactDOM.createPortal(
            <ImageGalleryModal
              isOpen={isGalleryOpen}
              onClose={() => setIsGalleryOpen(false)}
              images={item.images || []}
              itemId={item.id}
              readOnly={!editing}
              onImageUploaded={handleImageUploaded}
              onImageDeleted={handleImageDeleted}
              onSetPrimary={handleSetPrimaryImage}
            />,
            document.body
          )}
      </>
    );
  }
);

ItemRow.displayName = "ItemRow";
