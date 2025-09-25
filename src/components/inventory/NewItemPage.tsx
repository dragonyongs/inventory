// src/pages/inventory/NewItemPage.tsx
import React, { useCallback, useMemo, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  PackagePlus,
  Plus,
  Folder,
  ChevronDown,
} from "lucide-react";
import { z } from "zod";
import { useItemsStore } from "@/stores/itemsStore";
import { useCreateMovement } from "@/hooks/useCreateMovement";
import { useCategoriesStore } from "@/stores/categoriesStore";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { AddCategoryModal } from "@/components/inventory/AddCategoryModal";

// zod 스키마에 categoryId 추가
const schema = z.object({
  name: z.string().min(1, "상품명을 입력하세요"),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  minStock: z.coerce.number().min(0).default(0),
  price: z.coerce.number().min(0).optional(),
  qty: z.coerce.number().min(0).default(0),
  expiryDate: z.string().optional(),
  batchNumber: z.string().optional(),
  receivedDate: z.string().optional(),
  categoryId: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export const NewItemPage: React.FC = () => {
  const navigate = useNavigate();
  const addItem = useItemsStore((s) => s.addItem);
  const createMovement = useCreateMovement();
  const currentWorkspaceId = useWorkspaceStore((s) => s.currentWorkspaceId);
  const { getCategoriesByWorkspace, currentCategoryId } = useCategoriesStore();

  const [data, setData] = useState<FormData>({
    name: "",
    sku: "",
    barcode: "",
    minStock: 0,
    price: 0,
    qty: 0,
    expiryDate: "",
    batchNumber: "",
    receivedDate: new Date().toISOString().split("T")[0],
    categoryId: "", // 🔥 카테고리 초기값
  });

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);

  useEffect(() => {
    if (currentCategoryId && !data.categoryId) {
      console.log("새 카테고리 감지됨:", currentCategoryId);
      setData((prev) => ({
        ...prev,
        categoryId: currentCategoryId,
      }));
    }
  }, [currentCategoryId, data.categoryId]);

  // 워크스페이스의 카테고리 목록
  const availableCategories = useMemo(() => {
    if (!currentWorkspaceId) return [];
    const categories = getCategoriesByWorkspace(currentWorkspaceId);
    return categories;
  }, [currentWorkspaceId, getCategoriesByWorkspace, currentCategoryId]);

  // 선택된 카테고리 정보
  const selectedCategory = useMemo(() => {
    if (!data.categoryId) return null;
    const category =
      availableCategories.find((cat) => cat.id === data.categoryId) || null;
    return category;
  }, [data.categoryId, availableCategories]);

  const onChange = useCallback(
    <K extends keyof FormData>(key: K, value: FormData[K]) => {
      console.log(`필드 변경: ${String(key)} =`, value);
      setData((d) => ({ ...d, [key]: value }));
    },
    []
  );

  const isValid = useMemo(() => {
    const valid = schema.safeParse(data).success && data.name.trim();
    return valid;
  }, [data]);

  const handleSave = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setSaving(true);

      console.log("저장 시도, 폼 데이터:", data);

      const parsed = schema.safeParse(data);
      if (!parsed.success) {
        const errorMsg =
          parsed.error.issues[0]?.message ?? "입력값을 확인해주세요";
        console.error("유효성 검사 실패:", parsed.error.issues);
        setError(errorMsg);
        setSaving(false);
        return;
      }

      try {
        const { qty, minStock, price, categoryId, ...otherData } = parsed.data;

        const item = addItem({
          ...otherData,
          minStock,
          defaultPrice: price,
          stock: 0,
          categoryId: categoryId || undefined,
        });

        console.log("아이템 생성됨:", item);

        if (qty > 0) {
          await createMovement({
            type: "IN",
            itemId: item.id,
            qty,
            reason: "초기 입고",
          });
          console.log("초기 입고 완료:", qty);
        }

        navigate("/inventory", { replace: true });
      } catch (error) {
        console.error("상품 등록 실패:", error);
        setError(String(error));
      } finally {
        setSaving(false);
      }
    },
    [data, addItem, createMovement, navigate]
  );

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      {/* 헤더 */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <PackagePlus className="w-6 h-6 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">새 상품 등록</h1>
              <p className="text-gray-600">
                상품을 등록하고 재고를 효율적으로 관리하세요
              </p>
            </div>
          </div>
          <Link
            to="/inventory"
            className="inline-flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4" />
            목록으로
          </Link>
        </div>
      </div>

      {/* 메인 폼 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
          <Plus className="w-5 h-5 mr-2 text-blue-600" />
          상품 정보
        </h3>

        <form onSubmit={handleSave} className="space-y-6">
          {/* 기본 정보 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-gray-900 flex items-center">
                <PackagePlus className="w-4 h-4 mr-2 text-blue-600" />
                기본 정보
              </h4>
              <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                필수 입력
              </span>
            </div>

            {/* 상품명 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                상품명 <span className="text-red-500">*</span>
              </label>
              <input
                value={data.name}
                onChange={(e) => onChange("name", e.target.value)}
                placeholder="상품명을 입력하세요 (예: 동록 컴포트 상품)"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* 🔥 카테고리 선택 - 기본 정보 섹션에 추가 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                카테고리 (선택)
              </label>

              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <select
                    value={data.categoryId || ""}
                    onChange={(e) => onChange("categoryId", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white appearance-none pr-10"
                  >
                    <option value="">카테고리를 선택하세요 (선택사항)</option>
                    {availableCategories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.icon && `${category.icon} `}
                        {category.name}
                        {category.description && ` - ${category.description}`}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={16}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
                  />
                </div>

                {/* 새 카테고리 추가 버튼 - 모달 트리거 */}
                <button
                  type="button"
                  onClick={() => setIsAddCategoryModalOpen(true)}
                  className="
                    flex items-center px-3 py-2 border border-dashed border-gray-300 text-gray-600 
                    rounded-lg hover:border-gray-400 hover:text-gray-800 transition-colors
                  "
                  title="새 카테고리 추가"
                >
                  <Plus size={16} />
                </button>
              </div>

              {/* 선택된 카테고리 미리보기 */}
              {selectedCategory && (
                <div className="mt-2 flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg text-sm">
                  <Folder size={14} className="text-gray-500" />
                  {selectedCategory.icon && (
                    <span>{selectedCategory.icon}</span>
                  )}
                  <span className="text-gray-700">{selectedCategory.name}</span>
                  {selectedCategory.description && (
                    <span className="text-gray-500">
                      - {selectedCategory.description}
                    </span>
                  )}
                </div>
              )}

              {/* 🔥 디버그 정보 (개발용) */}
              {process.env.NODE_ENV === "development" && (
                <div className="mt-2 text-xs text-gray-400">
                  <div>
                    사용 가능한 카테고리: {availableCategories.length}개
                  </div>
                  <div>선택된 카테고리 ID: {data.categoryId || "없음"}</div>
                  <div>
                    전역 currentCategoryId: {currentCategoryId || "없음"}
                  </div>
                </div>
              )}
            </div>

            {/* 수치 정보 그리드 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  최소 재고
                </label>
                <input
                  value={data.minStock}
                  onChange={(e) =>
                    onChange("minStock", Number(e.target.value) || 0)
                  }
                  placeholder="10"
                  type="number"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  가격
                </label>
                <input
                  value={data.price ?? ""}
                  onChange={(e) =>
                    onChange("price", Number(e.target.value) || undefined)
                  }
                  placeholder="1000"
                  type="number"
                  step="0.01"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  초기 수량
                </label>
                <input
                  value={data.qty}
                  onChange={(e) => onChange("qty", Number(e.target.value) || 0)}
                  placeholder="100"
                  type="number"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  입고일 <span className="text-blue-500 text-xs">(오늘)</span>
                </label>
                <input
                  value={data.receivedDate ?? ""}
                  onChange={(e) => onChange("receivedDate", e.target.value)}
                  type="date"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* 고급 옵션 토글 */}
          <div className="border-t border-gray-200 pt-4">
            <button
              type="button"
              onClick={() => setShowAdvanced((s) => !s)}
              className="flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              고급 옵션
              <span className="ml-2 text-xs text-gray-400">
                {showAdvanced ? "숨기기" : "펼치기"}
              </span>
            </button>
          </div>

          {/* 고급 옵션 */}
          {showAdvanced && (
            <div className="space-y-6 bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    SKU 코드
                  </label>
                  <input
                    value={data.sku ?? ""}
                    onChange={(e) => onChange("sku", e.target.value)}
                    placeholder="APP-001"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    바코드
                  </label>
                  <input
                    value={data.barcode ?? ""}
                    onChange={(e) => onChange("barcode", e.target.value)}
                    placeholder="8801234567890"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    유통기한
                  </label>
                  <input
                    type="date"
                    value={data.expiryDate ?? ""}
                    onChange={(e) => onChange("expiryDate", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    배치번호/로트번호
                  </label>
                  <input
                    value={data.batchNumber ?? ""}
                    onChange={(e) => onChange("batchNumber", e.target.value)}
                    placeholder="LOT-20250924"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          )}

          <AddCategoryModal
            isOpen={isAddCategoryModalOpen}
            onClose={() => setIsAddCategoryModalOpen(false)}
          />

          {/* 버튼 */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div className="text-sm text-red-600">{error}</div>
            <button
              type="submit"
              disabled={!isValid || saving}
              className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              {saving ? "등록 중..." : "상품 등록"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
