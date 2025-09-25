// src/pages/SharedInventory.tsx

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import {
  Package,
  Eye,
  Minus,
  AlertTriangle,
  User,
  Search,
  Grid3X3,
  List,
  ExternalLink,
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

type SharePermission = "view" | "use";
type ViewMode = "grid" | "list";

const SharedInventory: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [searchParams] = useSearchParams();
  const permission =
    (searchParams.get("permission") as SharePermission) || "view";
  const workspaceId = searchParams.get("workspace");
  const categoryId = searchParams.get("category");

  // Stores
  const { user, isAuthenticated } = useAuthStore();
  const items = useItemsStore((s) => s.items);
  const { addMovement } = useMovementsStore();
  const workspace = useWorkspaceStore((s) =>
    s.workspaces.find((w) => w.id === workspaceId)
  );
  const category = useCategoriesStore((s) =>
    Object.values(s.categories).find((c) => c.id === categoryId)
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

        if (!token || !workspaceId || !categoryId) {
          throw new Error("잘못된 공유 링크입니다.");
        }

        // 실제 환경에서는 서버에서 토큰 검증
        // 현재는 클라이언트에서 기본 검증만 수행
        if (token.length < 10) {
          throw new Error("유효하지 않은 공유 토큰입니다.");
        }

        setError(null);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다."
        );
      } finally {
        setIsLoading(false);
      }
    };

    validateAndLoadData();
  }, [token, workspaceId, categoryId]);

  // 필터링된 아이템 목록
  const filteredItems = useMemo(() => {
    const categoryItems = Object.values(items).filter(
      (item) =>
        item.workspaceId === workspaceId &&
        item.categoryId === categoryId &&
        !item.isDeleted
    );

    if (!searchQuery.trim()) return categoryItems;

    const query = searchQuery.toLowerCase();
    return categoryItems.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        item.sku?.toLowerCase().includes(query) ||
        item.barcode?.toLowerCase().includes(query)
    );
  }, [items, workspaceId, categoryId, searchQuery]);

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

      // 재고 차감
      const newStock = item.stock - quantity;
      useItemsStore.getState().updateItem(itemId, { stock: newStock });

      // 사용자 정보 결정
      const finalUserName = isAuthenticated
        ? user?.name || user?.email || "인증된 사용자"
        : userName || "익명 사용자";

      // 사용 기록 추가 - 사용자 정보 포함
      const movement = {
        id: generateId("movement"),
        type: "USE" as const,
        itemId,
        qty: -quantity,
        reason: reason || "공유 페이지에서 사용",
        createdAt: new Date().toISOString(),
        // ✅ 사용자 정보 기록
        userName: finalUserName,
        userId: isAuthenticated ? user?.id : undefined,
        userEmail: isAuthenticated ? user?.email : undefined,
        isSharedAccess: true,
        shareToken: token,
      };

      addMovement(movement);

      // 성공 피드백
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            접근할 수 없습니다
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 backdrop-blur-sm bg-white/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* 좌측: 로고 및 정보 */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <Package className="w-8 h-8 text-blue-600" />
                <div className="ml-3">
                  <h1 className="text-lg font-semibold text-gray-900">
                    {workspace?.name || "재고 관리"}
                  </h1>
                  <p className="text-sm text-gray-600 hidden sm:block">
                    {category?.name || "카테고리"} • 공유 페이지
                  </p>
                </div>
              </div>
            </div>

            {/* 우측: 권한 및 사용자 정보 */}
            <div className="flex items-center space-x-3">
              {/* 권한 표시 */}
              <div
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  permission === "use"
                    ? "bg-green-100 text-green-800"
                    : "bg-blue-100 text-blue-800"
                }`}
              >
                {permission === "use" ? (
                  <>
                    <Minus className="w-4 h-4 mr-1" />
                    사용 가능
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4 mr-1" />
                    보기 전용
                  </>
                )}
              </div>

              {/* 디바이스 표시 */}
              <div className="hidden sm:flex items-center text-gray-500">
                {isMobile ? (
                  <Smartphone className="w-4 h-4" />
                ) : (
                  <Monitor className="w-4 h-4" />
                )}
              </div>

              {/* 사용자 정보 */}
              {isAuthenticated && user ? (
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-white">
                      {user.name?.[0] || user.email[0].toUpperCase()}
                    </span>
                  </div>
                  <span className="hidden sm:inline text-sm text-gray-700">
                    {user.name || user.email}
                  </span>
                </div>
              ) : (
                <div className="flex items-center space-x-2 text-gray-600">
                  <User className="w-5 h-5" />
                  <span className="hidden sm:inline text-sm">게스트</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* 검색 및 뷰 모드 */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
            {/* 검색 */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="상품명, SKU, 바코드로 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* 뷰 모드 선택 */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600 hidden sm:inline">
                {filteredItems.length}개 상품
              </span>
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded ${
                    viewMode === "grid"
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-gray-600 hover:text-gray-800"
                  }`}
                  title="그리드 보기"
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded ${
                    viewMode === "list"
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-gray-600 hover:text-gray-800"
                  }`}
                  title="리스트 보기"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 상품 목록 */}
        {filteredItems.length > 0 ? (
          viewMode === "grid" ? (
            <SharedItemCard
              items={filteredItems}
              permission={permission}
              onUseItem={openUseModal}
            />
          ) : (
            <SharedItemList
              items={filteredItems}
              permission={permission}
              onUseItem={openUseModal}
            />
          )
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchQuery ? "검색 결과가 없습니다" : "등록된 상품이 없습니다"}
            </h3>
            <p className="text-gray-600">
              {searchQuery
                ? "다른 키워드로 검색해보세요"
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
      </main>

      {/* 사용 모달 */}
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
      <footer className="mt-12 border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
            <div className="flex items-center space-x-2 text-gray-600">
              <Shield className="w-4 h-4" />
              <span className="text-sm">안전한 공유 페이지</span>
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span>마지막 업데이트: 방금 전</span>
              <a
                href="/"
                className="flex items-center space-x-1 text-blue-600 hover:text-blue-700"
              >
                <ExternalLink className="w-4 h-4" />
                <span>관리 페이지</span>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default SharedInventory;
