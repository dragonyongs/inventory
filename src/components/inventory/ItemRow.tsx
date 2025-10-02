import React, { useState, useCallback, useMemo } from "react";
import { useStockByItem } from "@/stores/selectors";
import { getExpiryStatus } from "@/utils/expiryUtils";
import { type Item } from "@/stores/itemsStore";
import { useCategoriesStore } from "@/stores/categoriesStore";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { ItemActions } from "./ItemActions";
import { Image, ZoomIn } from "lucide-react";
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
      thumbnailUrl: item.thumbnailUrl ?? "",
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
        thumbnailUrl: form.thumbnailUrl || undefined,
      });
      setEditing(false);
    }, [onEdit, form]);

    // 이미지 관리 핸들러
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

    // 썸네일 클릭 핸들러
    const handleThumbnailClick = useCallback(() => {
      if (item.images && item.images.length > 0) {
        setIsGalleryOpen(true);
      }
    }, [item.images]);

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
        thumbnailUrl: item.thumbnailUrl ?? "",
      });
    }, [item]);

    const handleEdit = useCallback(() => {
      setEditing(true);
    }, []);

    const isLowStock =
      typeof item.minStock === "number" &&
      item.minStock > 0 &&
      stock <= item.minStock;

    return (
      <tr
        className={`border-b border-gray-100 hover:bg-gray-50/50 transition-colors ${
          editing && "bg-gray-50"
        }`}
      >
        <td className="py-4 px-6">
          {editing ? (
            item.thumbnailUrl ? (
              <button onClick={handleThumbnailClick} className="relative group">
                <img
                  src={item.thumbnailUrl || item.images![0].directUrl}
                  alt={item.name}
                  className="w-14 h-14 object-cover rounded-lg border border-gray-200 group-hover:border-blue-400 transition-colors"
                  loading="lazy"
                />
                {/* 이미지 개수 뱃지 */}
                {item.images && item.images.length > 1 && (
                  <div className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-medium">
                    {item.images.length}
                  </div>
                )}
              </button>
            ) : (
              <div className="w-12 h-12 flex items-center justify-center bg-gray-100 rounded border border-gray-200">
                <Image className="w-6 h-6 text-gray-400" />
              </div>
            )
          ) : (
            <div
              onClick={handleThumbnailClick}
              className="cursor-pointer relative group w-14"
            >
              {item.thumbnailUrl ? (
                <>
                  <img
                    src={item.thumbnailUrl}
                    alt={item.name}
                    className="w-14 h-14 object-cover rounded-lg border-2 border-gray-200 group-hover:border-blue-400 transition-all"
                    loading="lazy"
                  />
                  {/* 이미지 개수 뱃지 */}
                  {item.images && item.images.length > 1 && (
                    <div className="z-10 absolute -top-1 -right-1 bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full font-semibold">
                      {item.images.length}
                    </div>
                  )}
                  {/* 호버 오버레이 */}
                  <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-40 rounded-lg transition-all flex items-center justify-center">
                    <ZoomIn className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </>
              ) : (
                <div className="w-14 h-14 flex items-center justify-center bg-gray-100 rounded-lg border-2 border-gray-200 cursor-pointer hover:border-blue-300 transition-colors">
                  <Image className="w-6 h-6 text-gray-400" />
                </div>
              )}
            </div>
          )}

          {/* 모달 갤러리 (편집 가능 버전) */}
          {isGalleryOpen && (
            <ImageGalleryModal
              isOpen={isGalleryOpen}
              onClose={() => setIsGalleryOpen(false)}
              images={item.images || []}
              itemId={item.id}
              readOnly={!editing}
              onImageUploaded={handleImageUploaded}
              onImageDeleted={handleImageDeleted}
              onSetPrimary={handleSetPrimaryImage}
            />
          )}
        </td>

        {/* 상품 정보 */}
        <td className="py-4 px-6">
          {editing ? (
            <div className="space-y-2">
              {/* 카테고리 선택 */}
              <select
                value={form.categoryId}
                onChange={(e) =>
                  setForm({ ...form, categoryId: e.target.value })
                }
                className="w-full px-3 py-2 pr-8 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white appearance-none cursor-pointer"
              >
                <option value="">카테고리 선택</option>
                {availableCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.icon && `${category.icon} `}
                    {category.name}
                  </option>
                ))}
              </select>

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
            <div>
              <div className="font-semibold text-gray-900 mb-1">
                {item.name}
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                {item.sku && <div>SKU: {item.sku}</div>}
                {item.barcode && <div>바코드: {item.barcode}</div>}
                {(item.defaultPrice || item.batchNumber) && (
                  <div className="text-xs text-gray-500">
                    {item.defaultPrice && (
                      <span>가격: {item.defaultPrice.toLocaleString()}원</span>
                    )}
                    {item.batchNumber && <span>로트: {item.batchNumber}</span>}
                  </div>
                )}
              </div>
            </div>
          )}
        </td>

        {/* 재고량 */}
        <td className="py-4 px-6">
          <div className="space-y-1 text-nowrap">
            {editing ? (
              <input
                type="number"
                value={form.minStock}
                onChange={(e) =>
                  setForm((s) => ({ ...s, minStock: e.target.value }))
                }
                className="flex-1 w-20 px-2 py-1 bg-white border border-gray-200 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm text-right"
                placeholder="최소 수량"
              />
            ) : (
              <>
                <div className="text-lg font-bold text-gray-900">{stock}개</div>
                {typeof item.minStock === "number" && item.minStock > 0 && (
                  <div className="text-xs text-gray-500">
                    최소: {item.minStock}개
                  </div>
                )}
              </>
            )}
          </div>
        </td>

        {/* 입고일 */}
        <td className="py-4 px-6">
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
            <div className="text-sm">
              {item.receivedDate ? (
                <span className="text-gray-900">
                  {new Date(item.receivedDate).toLocaleDateString("ko-KR")}
                </span>
              ) : (
                <span className="text-gray-400">-</span>
              )}
            </div>
          )}
        </td>

        {/* 유통기한 */}
        <td className="py-4 px-6">
          {editing ? (
            <div className="space-y-2">
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
            <div className="text-sm">
              {item.expiryDate ? (
                <span className="text-gray-900">
                  {new Date(item.expiryDate).toLocaleDateString("ko-KR")}
                </span>
              ) : (
                <span className="text-gray-400">-</span>
              )}
            </div>
          )}
        </td>

        {/* 상태 */}
        <td className="py-4 px-6">
          <div className="flex flex-col gap-1 text-nowrap">
            {isLowStock && (
              <span className="inline-flex items-center justify-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 max-w-24">
                재고부족
              </span>
            )}
            {expiryStatus && expiryStatus.status !== "safe" && (
              <span
                className={`inline-flex justify-center items-center px-2 py-1 rounded-full text-xs font-medium max-w-24 ${
                  expiryStatus.status === "expired"
                    ? "bg-red-100 text-red-800"
                    : expiryStatus.status === "critical"
                    ? "bg-red-100 text-red-800"
                    : expiryStatus.status === "warning"
                    ? "bg-orange-100 text-orange-800"
                    : "bg-amber-100 text-amber-800"
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
                <span className="inline-flex justify-center items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 max-w-24">
                  정상
                </span>
              )}
          </div>
        </td>

        {/* 작업 */}
        <td className="py-4 px-6">
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
    );
  }
);

ItemRow.displayName = "ItemRow";
