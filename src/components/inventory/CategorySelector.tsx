// src/components/inventory/CategorySelector.tsx
import React, { useState, useCallback, useEffect, useRef } from "react";
import { Plus, MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { useCategoriesStore } from "@/stores/categoriesStore";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { AddCategoryModal } from "./AddCategoryModal";
import type { Category } from "@/stores/categoriesStore";

export function CategorySelector() {
  const currentWorkspaceId = useWorkspaceStore((s) => s.currentWorkspaceId);
  const {
    currentCategoryId,
    setCurrentCategory,
    getCategoriesByWorkspace,
    deleteCategory,
  } = useCategoriesStore();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    category: Category;
  } | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const workspaceCategories = getCategoriesByWorkspace(currentWorkspaceId!);

  // useRef 타입 수정 및 import 확인
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // 컨텍스트 메뉴 핸들러
  const handleCategoryRightClick = useCallback(
    (e: React.MouseEvent, category: Category) => {
      e.preventDefault();
      setContextMenu({
        x: e.clientX,
        y: e.clientY,
        category,
      });
    },
    []
  );

  // 컨텍스트 메뉴 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null);
    if (contextMenu) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [contextMenu]);

  // 스크롤 상태 확인
  const checkScrollButtons = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    setCanScrollLeft(container.scrollLeft > 0);
    setCanScrollRight(
      container.scrollLeft < container.scrollWidth - container.clientWidth
    );
  }, []);

  // 스크롤 버튼 핸들러
  const scrollLeft = useCallback(() => {
    scrollContainerRef.current?.scrollBy({ left: -120, behavior: "smooth" });
  }, []);

  const scrollRight = useCallback(() => {
    scrollContainerRef.current?.scrollBy({ left: 120, behavior: "smooth" });
  }, []);

  // 활성 카테고리로 자동 스크롤
  useEffect(() => {
    // setTimeout으로 DOM 업데이트 후 실행
    const timer = setTimeout(() => {
      if (!scrollContainerRef.current) return;

      let targetElement: Element | null = null;

      if (currentCategoryId === null) {
        // "전체" 버튼으로 스크롤
        targetElement = scrollContainerRef.current.querySelector(
          '[data-category-id="all"]'
        );
      } else {
        // 특정 카테고리 버튼으로 스크롤
        targetElement = scrollContainerRef.current.querySelector(
          `[data-category-id="${currentCategoryId}"]`
        );
      }

      if (targetElement) {
        targetElement.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });

        console.log("Scrolled to:", currentCategoryId || "all"); // 디버깅용
      } else {
        console.warn("Target element not found:", currentCategoryId || "all"); // 디버깅용
      }
    }, 0); // 0ms로 다음 틱에 실행

    return () => clearTimeout(timer);
  }, [currentCategoryId]);

  // 스크롤 이벤트 리스너
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => checkScrollButtons();
    container.addEventListener("scroll", handleScroll);

    // 초기 상태 확인
    checkScrollButtons();

    return () => container.removeEventListener("scroll", handleScroll);
  }, [checkScrollButtons]);

  // 화면 크기 변경 감지 (SSR 안전)
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // 클라이언트에서만 실행
    setIsMobile(window.innerWidth < 768);

    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      checkScrollButtons();
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [checkScrollButtons]);

  return (
    <div className="relative px-3 md:px-6">
      {/* 메인 카테고리 네비게이션 */}
      <div className="flex items-center gap-1 p-1 bg-white rounded-xl border border-gray-100 overflow-x-auto scrollbar-hide">
        {/* 좌측 스크롤 버튼 */}
        {canScrollLeft && (
          <div className="z-20 absolute -left-2">
            <button
              onClick={scrollLeft}
              className="flex-shrink-0 p-1 rounded-full bg-white shadow-md hover:shadow-lg transition-shadow z-10"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
          </div>
        )}

        {/* 전체 버튼 - 항상 첫 번째 */}
        <button
          data-category-id="all"
          onClick={() => setCurrentCategory(null)}
          className={`
             flex-shrink-0 px-4 py-2.5 rounded-lg text-sm font-medium 
            whitespace-nowrap transition-all duration-200 min-w-[60px]
            ${
              !currentCategoryId
                ? "bg-gray-900 text-white shadow-sm"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            }
          `}
        >
          <div className="flex items-center gap-2">
            <span>전체</span>
          </div>
        </button>

        {/* 스크롤 가능한 카테고리 영역 */}
        <div
          ref={scrollContainerRef}
          className="flex items-center gap-1 overflow-x-auto scrollbar-hide max-w-[calc(100vw-160px)] md:max-w-[calc(100vw-180px)] lg:max-w-[calc(100vw-320px)]"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {workspaceCategories.map((category) => (
            <button
              data-category-id={category.id}
              key={category.id}
              onClick={() => setCurrentCategory(category.id)}
              onContextMenu={(e) => handleCategoryRightClick(e, category)}
              className={`
                group flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium 
              whitespace-nowrap transition-all duration-200 relative flex-shrink-0
              min-w-fit max-w-[120px]
                ${
                  currentCategoryId === category.id
                    ? "bg-gray-900 text-white shadow-sm"
                    : "bg-gray-50 text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-100"
                }
              `}
            >
              {category.icon && (
                <span className="flex-shrink-0 text-sm">{category.icon}</span>
              )}
              <span className="truncate">{category.name}</span>

              {/* 호버 시 점 3개 메뉴 */}
              {!isMobile && (
                <div
                  className={`
                opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity ml-1 
                ${
                  currentCategoryId === category.id
                    ? "text-white"
                    : "text-gray-400"
                }
                  `}
                >
                  <MoreHorizontal className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                </div>
              )}
            </button>
          ))}
        </div>

        {/* 고정된 추가 버튼 */}
        <div className="flex-shrink-0 ml-1">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="
              group p-2.5 rounded-lg text-gray-500 hover:text-gray-900 
              hover:bg-white/60 transition-all duration-200
              border border-dashed border-gray-300 hover:border-gray-400
              hover:shadow-sm
            "
            title="새 카테고리 추가"
          >
            <Plus
              size={16}
              className="group-hover:scale-110 transition-transform duration-200"
            />
          </button>
        </div>

        {/* 우측 스크롤 버튼 */}
        {canScrollRight && (
          <>
            <div className="z-20 absolute -right-2">
              <button
                onClick={scrollRight}
                className="flex-shrink-0 p-1 rounded-full bg-white shadow-md hover:shadow-lg transition-shadow z-10"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>
            <div className="absolute right-0 top-0 w-8 h-full bg-gradient-to-l from-white via-white/80 to-transparent pointer-events-none" />
          </>
        )}
      </div>

      {/* 컨텍스트 메뉴 */}
      {contextMenu && (
        <div
          className="fixed bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 min-w-32"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            onClick={() => {
              setEditingCategory(contextMenu.category);
              setContextMenu(null);
            }}
            className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
          >
            <Edit size={14} />
            편집
          </button>
          <button
            onClick={() => {
              if (
                confirm(
                  `"${contextMenu.category.name}" 카테고리를 삭제하시겠습니까?`
                )
              ) {
                deleteCategory(contextMenu.category.id);
              }
              setContextMenu(null);
            }}
            className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
          >
            <Trash2 size={14} />
            삭제
          </button>
        </div>
      )}

      {/* 카테고리 추가 모달 */}
      <AddCategoryModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />

      {editingCategory && (
        <AddCategoryModal
          isOpen={true}
          onClose={() => setEditingCategory(null)}
          editingCategory={editingCategory} // 편집 모드
        />
      )}
    </div>
  );
}
