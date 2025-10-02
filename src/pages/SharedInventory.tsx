// src/pages/SharedInventory.tsx

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import {
  Package,
  Eye,
  Minus,
  AlertTriangle,
  Shield,
  Smartphone,
  Monitor,
} from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useItemsStore, type Item } from "@/stores/itemsStore";
import { useMovementsStore } from "@/stores/movementsStore";
import { useCategoriesStore } from "@/stores/categoriesStore";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { generateId } from "@/utils/generateId";
import { SharedItemCard } from "@/components/shared/SharedItemCard";
import { SharedItemList } from "@/components/shared/SharedItemList";
import { UseItemModal } from "@/components/shared/UseItemModal";
import { SharedInventoryFilters } from "@/components/shared/SharedInventoryFilters";

type SharePermission = "view" | "use";
type ViewMode = "grid" | "list";

const SharedInventory: React.FC = () => {
  const { token, workspaceId: workspaceIdParam } = useParams<{
    token?: string;
    workspaceId?: string;
  }>();
  const [searchParams] = useSearchParams();

  const permission =
    (searchParams.get("permission") as SharePermission) || "view";

  const workspaceId = workspaceIdParam || searchParams.get("workspace");
  const categoryId = searchParams.get("category");

  // Stores
  const { user, isAuthenticated } = useAuthStore();
  const items = useItemsStore((s) => s.items);
  const { addMovement } = useMovementsStore();

  const workspace = useWorkspaceStore((s) =>
    workspaceId ? s.getWorkspaceById(workspaceId) : null
  );

  const category = useCategoriesStore((s) =>
    categoryId
      ? Object.values(s.categories).find((c) => c.id === categoryId)
      : null
  );

  // Local state
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [useModalOpen, setUseModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // 모바일 감지
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // 공유 링크 검증 및 데이터 로딩
  useEffect(() => {
    const validateAndLoadData = async () => {
      try {
        setIsLoading(true);

        // 케이스 1: 워크스페이스 전체 공유
        if (workspaceIdParam) {
          if (!workspace) {
            throw new Error("워크스페이스를 찾을 수 없습니다.");
          }
          console.log("✅ 워크스페이스 전체 공유 모드:", workspace.name);
          setError(null);
          return;
        }

        // 케이스 2: 특정 카테고리 공유
        if (token) {
          if (!workspaceId || !categoryId) {
            throw new Error("잘못된 공유 링크입니다.");
          }

          if (token.length < 10) {
            throw new Error("유효하지 않은 공유 토큰입니다.");
          }

          if (!workspace) {
            throw new Error("워크스페이스를 찾을 수 없습니다.");
          }

          if (!category) {
            throw new Error("카테고리를 찾을 수 없습니다.");
          }

          console.log("✅ 카테고리 공유 모드:", category.name);
          setError(null);
          return;
        }

        throw new Error("잘못된 공유 링크입니다.");
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다."
        );
      } finally {
        setIsLoading(false);
      }
    };

    validateAndLoadData();
  }, [token, workspaceIdParam, workspaceId, categoryId, workspace, category]);

  // 필터링된 아이템 목록
  const filteredItems = useMemo(() => {
    let baseItems: Item[] = [];

    if (workspaceIdParam && workspaceId) {
      baseItems = Object.values(items).filter(
        (item) => item.workspaceId === workspaceId && !item.isDeleted
      );
    } else if (workspaceId && categoryId) {
      baseItems = Object.values(items).filter(
        (item) =>
          item.workspaceId === workspaceId &&
          item.categoryId === categoryId &&
          !item.isDeleted
      );
    }

    if (!searchQuery.trim()) return baseItems;

    const query = searchQuery.toLowerCase();
    return baseItems.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        item.sku?.toLowerCase().includes(query) ||
        item.barcode?.toLowerCase().includes(query)
    );
  }, [items, workspaceId, workspaceIdParam, categoryId, searchQuery]);

  // 아이템 사용 처리
  const handleUseItem = useCallback(
    async (
      itemId: string,
      quantity: number,
      reason: string,
      userName?: string
    ) => {
      const item = items[itemId];
      if (!item || quantity <= 0 || quantity > item.stock) return;

      const newStock = item.stock - quantity;
      useItemsStore.getState().updateItem(itemId, { stock: newStock });

      const finalUserName = isAuthenticated
        ? user?.name || user?.email || "인증된 사용자"
        : userName || "익명 사용자";

      const movement = {
        id: generateId("movement"),
        type: "USE" as const,
        itemId,
        qty: -quantity,
        reason: reason || "공유 페이지에서 사용",
        createdAt: new Date().toISOString(),
        userName: finalUserName,
        userId: isAuthenticated ? user?.id : undefined,
        userEmail: isAuthenticated ? user?.email : undefined,
        isSharedAccess: true,
        shareToken: token,
      };

      addMovement(movement);

      console.log(
        `✅ ${item.name} ${quantity}개 사용 완료 (사용자: ${finalUserName})`
      );
    },
    [items, addMovement, user, token, isAuthenticated]
  );

  const openUseModal = useCallback(
    (item: Item) => {
      if (permission !== "use") return;
      setSelectedItem(item);
      setUseModalOpen(true);
    },
    [permission]
  );

  const closeUseModal = useCallback(() => {
    setSelectedItem(null);
    setUseModalOpen(false);
  }, []);

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">공유 페이지를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center max-w-md mx-auto p-8 bg-white rounded-xl shadow-lg">
          <div className="mb-4">
            <AlertTriangle className="mx-auto h-16 w-16 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            접근할 수 없습니다
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  const shareTitle = workspaceIdParam
    ? `${workspace?.name || "워크스페이스"} - 전체 품목`
    : `${category?.name || "카테고리"} - 품목`;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Package className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {shareTitle}
                </h1>
                <p className="text-sm text-gray-500">
                  {workspace?.name || "공유된 품목"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`flex items-center justify-center px-3 py-1.5 rounded-full text-xs font-medium ${
                  permission === "view"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-green-100 text-green-700"
                }`}
              >
                {permission === "view" ? (
                  <>
                    <Eye className="inline h-3 w-3 mr-1" />
                    보기 전용
                  </>
                ) : (
                  <>
                    <Minus className="inline h-3 w-3 mr-1" />
                    사용 가능
                  </>
                )}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* 검색 및 필터 */}
        <SharedInventoryFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          itemCount={filteredItems.length}
        />

        {/* 상품 목록 */}
        <div className="mt-6">
          {filteredItems.length > 0 ? (
            viewMode === "grid" ? (
              // ✅ 수정: SharedItemCard는 items 배열을 받으므로 filteredItems를 그대로 전달
              <SharedItemCard
                items={filteredItems}
                permission={permission}
                onUseItem={openUseModal}
              />
            ) : (
              // ✅ 수정: SharedItemList의 prop 이름 확인 필요 (onUseClick -> onUseItem)
              <SharedItemList
                items={filteredItems}
                permission={permission}
                onUseItem={openUseModal}
              />
            )
          ) : (
            <div className="text-center py-16 bg-white rounded-lg shadow">
              <Package className="mx-auto h-16 w-16 text-gray-300 mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">
                {searchQuery
                  ? "검색 결과가 없습니다"
                  : "등록된 상품이 없습니다"}
              </p>
              <p className="text-gray-500">
                {searchQuery
                  ? "다른 키워드로 검색해보세요"
                  : workspaceIdParam
                  ? "이 워크스페이스에는 아직 상품이 등록되지 않았습니다"
                  : "이 카테고리에는 아직 상품이 등록되지 않았습니다"}
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="mt-4 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  전체 상품 보기
                </button>
              )}
            </div>
          )}
        </div>

        {/* UseItemModal */}
        {selectedItem && (
          <UseItemModal
            isOpen={useModalOpen}
            onClose={closeUseModal}
            item={selectedItem}
            onConfirm={handleUseItem}
            isAuthenticated={isAuthenticated}
            user={user}
          />
        )}

        {/* 하단 정보 */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span>안전한 공유</span>
            </div>
            <div className="flex items-center gap-2">
              {isMobile ? (
                <Smartphone className="h-4 w-4" />
              ) : (
                <Monitor className="h-4 w-4" />
              )}
              <span>모든 기기에서 접근 가능</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SharedInventory;
