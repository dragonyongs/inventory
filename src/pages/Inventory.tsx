// src/pages/Inventory.tsx

import { useMemo, useState, useCallback, useEffect } from "react";
import { Package, CheckCircle, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useVisibleItems, useSetQuery, useQuery } from "../stores/selectors";
import { useItemsStore, type Item } from "@/stores/itemsStore";

import { InventoryFilters } from "@/components/inventory/InventoryFilters";
import { EmptyInventoryState } from "@/components/inventory/EmptyInventoryState";

import { useAdjustStock } from "@/hooks/useAdjustStock";
import { AdjustStockModal } from "@/components/inventory/AdjustStockModal";
import { ItemRow } from "@/components/inventory/ItemRow";

import { CategorySelector } from "@/components/inventory/CategorySelector";

import { HeaderActions } from "@/components/inventory/HeaderActions";

export default function Inventory() {
  const navigate = useNavigate();
  const items = useVisibleItems();
  const setQuery = useSetQuery();
  const q = useQuery();
  const updateItem = useItemsStore((s) => s.updateItem);
  const removeItem = useItemsStore((s) => s.removeItem);
  const [addedId, setAddedId] = useState<string | null>(null);

  const { adjustFor, openAdjustModal, closeAdjustModal, isAdjustModalOpen } =
    useAdjustStock();

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

  // const handleAdjust = useCallback((id: string) => {
  //   setAdjustFor(id);
  // }, []);

  const handleSearchChange = useCallback(
    (value: string) => {
      setQuery(value);
    },
    [setQuery]
  );

  const handleNewItem = useCallback(() => {
    navigate("/inventory/new");
  }, [navigate]);

  // 성공 알림 자동 숨김
  const hideSuccessNotification = useCallback(() => {
    if (addedId) {
      const timer = setTimeout(() => setAddedId(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [addedId]);
  useEffect(hideSuccessNotification, [hideSuccessNotification]);

  // 검색 쿼리 존재 여부 확인
  const hasSearchQuery = q.trim().length > 0;

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">인벤토리</h1>
          <p className="text-gray-600 mt-1">
            상품을 등록하고 재고를 효율적으로 관리하세요
          </p>
        </div>

        <HeaderActions onNewItem={handleNewItem} />
      </div>

      <div className="mb-6">
        <CategorySelector />
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

      {/* 검색 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
        <InventoryFilters searchQuery={q} onSearchChange={handleSearchChange} />
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
                    onAdjust={() => openAdjustModal(item.id)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyInventoryState
            hasSearchQuery={hasSearchQuery}
            searchQuery={q}
          />
        )}
      </div>

      {/* 재고 조정 모달 */}
      {adjustFor && (
        <AdjustStockModal
          itemId={adjustFor}
          isOpen={isAdjustModalOpen}
          onClose={closeAdjustModal}
        />
      )}
    </div>
  );
}
