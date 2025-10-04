// src/components/inventory/CategorySelector.tsx

import React, { useState, useCallback, useEffect, useRef } from "react";
import { useIsMobile } from "@/hooks/useMediaQuery";
import {
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useCategoriesStore } from "@/stores/categoriesStore";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { AddCategoryModal } from "./AddCategoryModal";
import type { Category } from "@/stores/categoriesStore";

export const CategorySelector = React.memo(function CategorySelector() {
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

    setCanScrollLeft(container.scrollLeft > 5); // 여유값 추가
    setCanScrollRight(
      container.scrollLeft < container.scrollWidth - container.clientWidth - 5
    );
  }, []);

  // 스크롤 버튼 핸들러
  const scrollLeft = useCallback(() => {
    scrollContainerRef.current?.scrollBy({ left: -200, behavior: "smooth" });
  }, []);

  const scrollRight = useCallback(() => {
    scrollContainerRef.current?.scrollBy({ left: 200, behavior: "smooth" });
  }, []);

  // 활성 카테고리로 자동 스크롤
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!scrollContainerRef.current) return;

      let targetElement: Element | null = null;

      if (currentCategoryId === null) {
        targetElement = scrollContainerRef.current.querySelector(
          '[data-category-id="all"]'
        );
      } else {
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
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [currentCategoryId]);

  // 스크롤 이벤트 리스너
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => checkScrollButtons();
    container.addEventListener("scroll", handleScroll);

    // 초기 상태 확인 (약간의 지연 추가)
    const initialCheck = setTimeout(checkScrollButtons, 100);

    return () => {
      container.removeEventListener("scroll", handleScroll);
      clearTimeout(initialCheck);
    };
  }, [checkScrollButtons, workspaceCategories.length]);

  // 화면 크기 변경 감지
  const isMobile = useIsMobile();

  useEffect(() => {
    const handleResize = () => checkScrollButtons();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [checkScrollButtons]);

  return (
    <div className="relative flex items-center gap-2 mb-6">
      {/* 좌측 스크롤 버튼 - 항상 보이도록 개선 */}
      {canScrollLeft && (
        <button
          onClick={scrollLeft}
          className="
            absolute left-0 z-20 flex-shrink-0
            w-8 h-8 rounded-full 
            bg-white/95 shadow-lg border border-gray-200
            flex items-center justify-center
            text-gray-700 hover:text-gray-900 hover:bg-white
            transition-all duration-200
            backdrop-blur-sm
            active:scale-95
          "
          aria-label="이전 카테고리"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}

      {/* 메인 카테고리 네비게이션 - 스크롤 영역 */}
      <div
        ref={scrollContainerRef}
        className="
          flex items-center gap-2 overflow-x-auto 
          scrollbar-hide scroll-smooth
          px-1 py-2
          -webkit-overflow-scrolling-touch
        "
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {/* 전체 버튼 - 스크롤 영역 내부로 이동 */}
        <button
          data-category-id="all"
          onClick={() => setCurrentCategory(null)}
          className={`
            flex-shrink-0 px-4 py-2.5 rounded-lg text-sm font-medium
            whitespace-nowrap transition-all duration-200 min-w-[64px]
            ${
              !currentCategoryId
                ? "bg-gray-900 text-white shadow-md"
                : "bg-gray-50 text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-200"
            }
          `}
        >
          전체
        </button>

        {/* 카테고리 버튼들 */}
        {workspaceCategories.map((category) => (
          <button
            key={category.id}
            data-category-id={category.id}
            onClick={() => setCurrentCategory(category.id)}
            onContextMenu={(e) => handleCategoryRightClick(e, category)}
            className={`
              group flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium
              whitespace-nowrap transition-all duration-200 relative flex-shrink-0
              min-w-fit max-w-[140px]
              ${
                currentCategoryId === category.id
                  ? "bg-gray-900 text-white shadow-md"
                  : "bg-gray-50 text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-200"
              }
            `}
          >
            {category.icon && (
              <span className="text-base">{category.icon}</span>
            )}
            <span className="truncate">{category.name}</span>

            {/* 호버 시 점 3개 메뉴 */}
            {!isMobile && (
              <MoreHorizontal
                className={`
                  w-4 h-4 opacity-0 group-hover:opacity-100 
                  transition-opacity absolute -right-1 -top-1
                  ${
                    currentCategoryId === category.id
                      ? "text-white"
                      : "text-gray-400"
                  }
                `}
              />
            )}
          </button>
        ))}
      </div>

      {/* 우측 스크롤 버튼 - 항상 보이도록 개선 */}
      {canScrollRight && (
        <button
          onClick={scrollRight}
          className="
            absolute right-14 z-20 flex-shrink-0
            w-8 h-8 rounded-full 
            bg-white/95 shadow-lg border border-gray-200
            flex items-center justify-center
            text-gray-700 hover:text-gray-900 hover:bg-white
            transition-all duration-200
            backdrop-blur-sm
            active:scale-95
          "
          aria-label="다음 카테고리"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      )}

      {/* 고정된 추가 버튼 - 우측 끝에 고정 */}
      <button
        onClick={() => setIsAddModalOpen(true)}
        className="
          absolute right-0 z-20 flex-shrink-0
          w-10 h-10 rounded-lg
          bg-white text-gray-500 hover:text-gray-900
          hover:bg-gray-50 transition-all duration-200
          border-2 border-dashed border-gray-300 hover:border-gray-400
          shadow-sm hover:shadow-md
          flex items-center justify-center
          backdrop-blur-sm
        "
        title="새 카테고리 추가"
        aria-label="새 카테고리 추가"
      >
        <Plus className="w-5 h-5" />
      </button>

      {/* 컨텍스트 메뉴 */}
      {contextMenu && (
        <div
          className="fixed z-50 bg-white rounded-lg shadow-xl border border-gray-200 py-1 min-w-[140px]"
          style={{
            top: `${contextMenu.y}px`,
            left: `${contextMenu.x}px`,
          }}
        >
          <button
            onClick={() => {
              setEditingCategory(contextMenu.category);
              setContextMenu(null);
            }}
            className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
          >
            <Edit className="w-4 h-4" />
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
            <Trash2 className="w-4 h-4" />
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
          editingCategory={editingCategory}
        />
      )}
    </div>
  );
});
