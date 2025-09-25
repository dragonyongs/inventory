// src/components/inventory/CategorySelector.tsx
import React, { useState, useCallback, useEffect } from "react";
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

  return (
    <div className="relative">
      {/* 메인 카테고리 네비게이션 */}
      <div className="flex items-center gap-1 p-1 bg-white rounded-xl border border-gray-100 overflow-hidden">
        {/* 전체 버튼 - 항상 첫 번째 */}
        <button
          onClick={() => setCurrentCategory(null)}
          className={`
            group relative px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
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
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide max-w-[calc(100vw-320px)]">
          {workspaceCategories.map((category) => (
            <button
              key={category.id}
              onClick={() => setCurrentCategory(category.id)}
              onContextMenu={(e) => handleCategoryRightClick(e, category)}
              className={`
                group flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap
                transition-all duration-200 relative
                ${
                  currentCategoryId === category.id
                    ? "bg-gray-900 text-white shadow-sm"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }
              `}
            >
              {category.icon && (
                <span className="text-sm">{category.icon}</span>
              )}
              {category.name}

              {/* 호버 시 점 3개 메뉴 */}
              <div
                className={`
                opacity-0 group-hover:opacity-100 transition-opacity ml-1
                ${
                  currentCategoryId === category.id
                    ? "text-white"
                    : "text-gray-400"
                }
              `}
              >
                <MoreHorizontal size={12} />
              </div>
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
