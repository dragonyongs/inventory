// src/pages/Inventory.tsx

import { useMemo, useState, useCallback, useEffect } from "react";
import { CheckCircle, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useVisibleItems, useSetQuery, useQuery } from "../stores/selectors";
import { useItemsStore, type Item } from "@/stores/itemsStore";
import { InventoryFilters } from "@/components/inventory/InventoryFilters";
import { EmptyInventoryState } from "@/components/inventory/EmptyInventoryState";
import InventoryTable from "@/components/inventory/InventoryTable";
import { useAdjustStock } from "@/hooks/useAdjustStock";
import { AdjustStockModal } from "@/components/inventory/AdjustStockModal";
import { CategorySelector } from "@/components/inventory/CategorySelector";
import { HeaderActions } from "@/components/inventory/HeaderActions";
import { getExpiryStatus } from "@/utils/expiryUtils";
import { PageHeader } from "@/components/shared/PageHeader";
import { useCategoriesStore } from "@/stores/categoriesStore";
import { useWorkspaceStore } from "@/stores/workspaceStore";

export default function Inventory() {
  const navigate = useNavigate();
  const items = useVisibleItems();
  const setQuery = useSetQuery();
  const q = useQuery();
  const updateItem = useItemsStore((s) => s.updateItem);
  const removeItem = useItemsStore((s) => s.removeItem);
  const currentWorkspaceId = useWorkspaceStore((s) => s.currentWorkspaceId);
  const { currentCategoryId, getCategoriesByWorkspace } = useCategoriesStore();
  const shareContext = useMemo(() => {
    if (!currentWorkspaceId) return "전체";

    const categories = getCategoriesByWorkspace(currentWorkspaceId);
    const currentCategory = currentCategoryId
      ? categories.find((c) => c.id === currentCategoryId)
      : null;

    return currentCategory ? currentCategory.name : "전체";
  }, [currentWorkspaceId, currentCategoryId, getCategoriesByWorkspace]);

  const [addedId, setAddedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [stockFilter, setStockFilter] = useState("");
  const [expiryFilter, setExpiryFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const { adjustFor, openAdjustModal, closeAdjustModal, isAdjustModalOpen } =
    useAdjustStock();

  // 📌 재고 정보를 가져오는 함수 (기존 셀렉터 사용)
  const getItemStock = useCallback(
    (itemId: string) => {
      const item = items.find((i) => i.id === itemId);
      return item?.stock || 0;
    },
    [items]
  );

  // 📌 필터링된 아이템들 (기존 useVisibleItems + 추가 필터)
  const filteredItems = useMemo(() => {
    let filtered = [...items];

    // 추가 필터들 적용
    if (statusFilter || stockFilter || expiryFilter) {
      filtered = filtered.filter((item) => {
        const stock = getItemStock(item.id);
        const expiryStatus = item.expiryDate
          ? getExpiryStatus(item.expiryDate)
          : null;
        const isLowStock =
          item.minStock && item.minStock > 0 && stock <= item.minStock;

        // 상태 필터
        if (statusFilter) {
          switch (statusFilter) {
            case "normal":
              if (
                isLowStock ||
                (expiryStatus && expiryStatus.status !== "safe")
              ) {
                return false;
              }
              break;
            case "lowStock":
              if (!isLowStock) return false;
              break;
            case "expiring":
              if (
                !expiryStatus ||
                !["near", "warning", "critical"].includes(expiryStatus.status)
              ) {
                return false;
              }
              break;
            case "expired":
              if (!expiryStatus || expiryStatus.status !== "expired") {
                return false;
              }
              break;
          }
        }

        // 재고량 필터
        if (stockFilter) {
          switch (stockFilter) {
            case "high":
              if (stock < 50) return false;
              break;
            case "medium":
              if (stock < 10 || stock >= 50) return false;
              break;
            case "low":
              if (stock >= 10 || stock === 0) return false;
              break;
            case "empty":
              if (stock !== 0) return false;
              break;
          }
        }

        // 유통기한 필터
        if (expiryFilter && expiryStatus) {
          if (expiryFilter !== expiryStatus.status) return false;
        } else if (expiryFilter && !expiryStatus) {
          return false;
        }

        return true;
      });
    }

    return filtered;
  }, [items, statusFilter, stockFilter, expiryFilter, getItemStock]);

  const sorted = useMemo(
    () =>
      [...filteredItems].sort(
        (a: any, b: any) =>
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime()
      ),
    [filteredItems]
  );

  // 📌 활성 필터 개수 계산
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (statusFilter) count++;
    if (stockFilter) count++;
    if (expiryFilter) count++;
    return count;
  }, [statusFilter, stockFilter, expiryFilter]);

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

  const handleSearchChange = useCallback(
    (value: string) => {
      setQuery(value);
    },
    [setQuery]
  );

  const handleNewItem = useCallback(() => {
    navigate("/inventory/new");
  }, [navigate]);

  // 📌 필터 핸들러들
  const handleToggleFilters = useCallback(() => {
    setShowFilters((prev) => !prev);
  }, []);

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
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-100 px-4 lg:px-6">
        <div className="py-6">
          <PageHeader
            title="인벤토리"
            description="상품을 등록하고 재고를 효율적으로 관리하세요"
            actions={
              <HeaderActions
                onNewItem={handleNewItem}
                shareContext={shareContext}
              />
            }
          />

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
      </div>

      {/* 📌 개선된 필터 컴포넌트 */}
      <InventoryFilters
        searchQuery={q}
        onSearchChange={handleSearchChange}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        stockFilter={stockFilter}
        onStockFilterChange={setStockFilter}
        expiryFilter={expiryFilter}
        onExpiryFilterChange={setExpiryFilter}
        showFilters={showFilters}
        onToggleFilters={handleToggleFilters}
        activeFiltersCount={activeFiltersCount}
      />

      {/* 품목 목록 */}
      {sorted.length > 0 ? (
        <InventoryTable
          items={sorted}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onAdjust={openAdjustModal}
        />
      ) : (
        <EmptyInventoryState
          hasSearchQuery={hasSearchQuery || activeFiltersCount > 0}
          searchQuery={q}
        />
      )}

      {/* 📌 필터 결과 요약 */}
      {(q.trim() || activeFiltersCount > 0) && (
        <div className="fixed bottom-6 right-6 bg-white rounded-xl shadow-lg border border-gray-200 px-4 py-3 z-30">
          <p className="text-sm font-medium text-gray-900">
            {sorted.length}개 품목이 조건에 맞습니다
          </p>
          {sorted.length !== items.length && (
            <p className="text-xs text-gray-600 mt-1">
              전체 {items.length}개 중 {items.length - sorted.length}개 숨겨짐
            </p>
          )}
        </div>
      )}

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
