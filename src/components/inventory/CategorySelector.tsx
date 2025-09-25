// src/components/inventory/CategorySelector.tsx
import React, { useState } from "react";
import { Plus, MoreHorizontal, Folder } from "lucide-react";
import { useCategoriesStore } from "@/stores/categoriesStore";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { AddCategoryModal } from "./AddCategoryModal";

export function CategorySelector() {
  const currentWorkspaceId = useWorkspaceStore((s) => s.currentWorkspaceId);
  const { currentCategoryId, setCurrentCategory, getCategoriesByWorkspace } =
    useCategoriesStore();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const workspaceCategories = getCategoriesByWorkspace(currentWorkspaceId!);

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
                ? "border border-blue-500 bg-blue-50 text-blue-700 shadow-sm hover:shadow-md"
                : "text-gray-600 hover:text-gray-900 hover:bg-white/60 "
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
              className={`
                group relative px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap
                flex items-center gap-2 transition-all duration-200 min-w-fit
                ${
                  currentCategoryId === category.id
                    ? "border border-blue-500 bg-blue-50 text-blue-700 shadow-sm hover:shadow-md"
                    : "text-gray-600 hover:text-gray-900 hover:bg-white/60"
                }
              `}
            >
              <div className="flex items-center gap-2">
                {category.icon && category.icon && <span>{category.icon}</span>}
                <span>{category.name}</span>
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

      {/* 카테고리 추가 모달 */}
      <AddCategoryModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
    </div>
  );
}
