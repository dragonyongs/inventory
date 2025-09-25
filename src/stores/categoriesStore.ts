// src/stores/categoriesStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Category {
  id: string;
  workspaceId: string;
  name: string;
  description?: string;
  icon?: string;
  parentId?: string; // 하위 폴더 지원
  isDefault?: boolean; // 기본 "전체" 카테고리
  permissions?: {
    isPublic?: boolean;
    shareToken?: string;
    allowedUsers?: string[];
  };
  createdAt: string;
  updatedAt: string;
}

interface CategoriesState {
  categories: Record<string, Category>;
  currentCategoryId: string | null; // 현재 선택된 카테고리
}

interface CategoriesActions {
  addCategory: (
    data: Omit<Category, "id" | "createdAt" | "updatedAt">
  ) => Category;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
  setCurrentCategory: (id: string | null) => void;
  getCategoriesByWorkspace: (workspaceId: string) => Category[];
  ensureDefaultCategory: (workspaceId: string) => Category;
  generateShareToken: (categoryId: string) => string;
}

export const useCategoriesStore = create<CategoriesState & CategoriesActions>()(
  persist(
    (set, get) => ({
      categories: {},
      currentCategoryId: null,

      addCategory: (data) => {
        const category: Category = {
          id: Math.random().toString(36).slice(2, 10),
          ...data,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        set((s) => ({
          categories: { ...s.categories, [category.id]: category },
          currentCategoryId: category.id,
        }));

        return category;
      },

      updateCategory: (id, updates) => {
        set((s) => ({
          categories: {
            ...s.categories,
            [id]: {
              ...s.categories[id],
              ...updates,
              updatedAt: new Date().toISOString(),
            },
          },
        }));
      },

      deleteCategory: (id) => {
        set((s) => {
          const newCategories = { ...s.categories };
          delete newCategories[id];
          return {
            categories: newCategories,
            currentCategoryId:
              s.currentCategoryId === id ? null : s.currentCategoryId,
          };
        });
      },

      setCurrentCategory: (id) => set({ currentCategoryId: id }),

      getCategoriesByWorkspace: (workspaceId) => {
        return Object.values(get().categories).filter(
          (cat) => cat.workspaceId === workspaceId
        );
      },

      ensureDefaultCategory: (workspaceId) => {
        const existing = Object.values(get().categories).find(
          (cat) => cat.workspaceId === workspaceId && cat.isDefault
        );

        if (existing) return existing;

        return get().addCategory({
          workspaceId,
          name: "전체",
          description: "모든 아이템",
          isDefault: true,
        });
      },

      generateShareToken: (categoryId) => {
        const token = Math.random().toString(36).slice(2, 15);
        get().updateCategory(categoryId, {
          permissions: {
            ...get().categories[categoryId]?.permissions,
            shareToken: token,
            isPublic: true,
          },
        });
        return token;
      },
    }),
    { name: "inventory-categories" }
  )
);
