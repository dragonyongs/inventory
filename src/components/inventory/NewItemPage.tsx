// src/pages/inventory/NewItemPage.tsx

import React, { useCallback, useMemo, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  ChevronDown,
  ChevronUp,
  Settings2,
} from "lucide-react";
// import { WonIcon } from "@/components/icons";
import { z } from "zod";
import { useItemsStore } from "@/stores/itemsStore";
import { useCreateMovement } from "@/hooks/useCreateMovement";
import { useCategoriesStore } from "@/stores/categoriesStore";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { AddCategoryModal } from "@/components/inventory/AddCategoryModal";
import { ImageUploader } from "@/components/inventory/ImageUploader";
import { ImageGallery } from "@/components/inventory/ImageGallery";
import type { ItemImage } from "@/types/image";

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

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<ItemImage[]>([]);

  const categories = useMemo(() => {
    if (!currentWorkspaceId) return [];
    return getCategoriesByWorkspace(currentWorkspaceId);
  }, [currentWorkspaceId, getCategoriesByWorkspace]);

  const [form, setForm] = useState<FormData>({
    name: "",
    sku: "",
    barcode: "",
    minStock: 0,
    price: 0,
    qty: 0,
    expiryDate: "",
    batchNumber: "",
    receivedDate: new Date().toISOString().split("T")[0],
    categoryId: currentCategoryId || "",
  });

  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>(
    {}
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (currentCategoryId && !form.categoryId) {
      setForm((prev) => ({ ...prev, categoryId: currentCategoryId }));
    }
  }, [currentCategoryId, form.categoryId]);

  const handleChange = useCallback(
    (field: keyof FormData) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setForm((prev) => ({ ...prev, [field]: e.target.value }));
        if (errors[field]) {
          setErrors((prev) => ({ ...prev, [field]: undefined }));
        }
      },
    [errors]
  );

  const handleImageUploaded = useCallback((image: ItemImage) => {
    setUploadedImages((prev) => {
      const isPrimary = prev.length === 0;
      return [...prev, { ...image, isPrimary }];
    });
  }, []);

  const handleSetPrimaryImage = useCallback((imageId: string) => {
    setUploadedImages((prev) =>
      prev.map((img) => ({
        ...img,
        isPrimary: img.id === imageId,
      }))
    );
  }, []);

  const handleDeleteImage = useCallback((imageId: string) => {
    setUploadedImages((prev) => prev.filter((img) => img.id !== imageId));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = schema.safeParse(form);
    if (!result.success) {
      const newErrors: Partial<Record<keyof FormData, string>> = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof FormData;
        if (field) {
          newErrors[field] = issue.message;
        }
      });
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const primaryImage = uploadedImages.find((img) => img.isPrimary);
      const item = addItem({
        name: form.name,
        sku: form.sku || undefined,
        barcode: form.barcode || undefined,
        stock: 0,
        minStock: form.minStock > 0 ? form.minStock : undefined,
        defaultPrice: form.price && form.price > 0 ? form.price : undefined,
        expiryDate: form.expiryDate || undefined,
        batchNumber: form.batchNumber || undefined,
        receivedDate: form.receivedDate || undefined,
        categoryId: form.categoryId || undefined,
        images: uploadedImages,
        thumbnailUrl: primaryImage?.directUrl,
      });

      const qty = Number(form.qty);
      if (qty > 0) {
        await createMovement({
          type: "IN",
          itemId: item.id,
          qty,
          reason: "초기 입고",
        });
      }

      setUploadedImages([]);
      navigate("/inventory");
    } catch (error) {
      console.error("상품 등록 실패:", error);
      alert("상품 등록에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-white pb-24">
      {/* 헤더 - 우버 스타일 초미니멀 */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="flex items-center h-14 px-4 max-w-2xl mx-auto">
          <Link
            to="/inventory"
            className="flex items-center justify-center w-10 h-10 -ml-2 
              text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="flex-1 text-center text-lg font-semibold text-gray-900 -ml-10">
            새 상품 등록
          </h1>
        </div>
      </header>

      {/* 메인 컨텐츠 - 패딩만 있는 심플한 구조 */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* 기본 정보 - 카드 없이 섹션으로만 */}
          <section className="space-y-5">
            <div>
              <h2 className="text-sm font-semibold text-gray-900 mb-1">
                기본 정보
              </h2>
              <p className="text-xs text-gray-500">필수 입력 항목입니다</p>
            </div>

            {/* 카테고리 선택 - 항상 표시 */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-gray-600 px-1">
                카테고리
              </label>
              {categories.length > 0 ? (
                <div className="flex gap-2">
                  <select
                    value={form.categoryId}
                    onChange={handleChange("categoryId")}
                    className="flex-1 px-4 py-3 bg-gray-50 border-0 rounded-lg
                      focus:outline-none focus:ring-1 focus:ring-gray-900 focus:bg-white
                      transition-all text-[15px] text-gray-900"
                  >
                    <option value="">선택하세요</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.icon && `${cat.icon} `}
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setIsCategoryModalOpen(true)}
                    className="flex items-center justify-center w-12 h-12 bg-gray-900
                      hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <Plus className="w-5 h-5 text-white" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 
                    bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors
                    text-white font-medium text-[15px]"
                >
                  <Plus className="w-5 h-5" />
                  카테고리 추가하기
                </button>
              )}
            </div>

            {/* 상품명 */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-gray-600 px-1">
                상품명 <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={handleChange("name")}
                placeholder="상품명을 입력하세요"
                className={`w-full px-4 py-3 bg-gray-50 border-0 rounded-lg
                  focus:outline-none focus:ring-1 focus:ring-gray-900 focus:bg-white
                  transition-all text-[15px] placeholder:text-gray-400 ${
                    errors.name ? "ring-1 ring-red-500 bg-red-50" : ""
                  }`}
              />
              {errors.name && (
                <p className="text-xs text-red-600 px-1 mt-1">{errors.name}</p>
              )}
            </div>

            {/* 3열 그리드 */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-gray-600 px-1">
                  최소재고
                </label>
                <input
                  type="number"
                  value={form.minStock}
                  onChange={handleChange("minStock")}
                  min="0"
                  className="w-full px-3 py-3 bg-gray-50 border-0 rounded-lg
                    focus:outline-none focus:ring-1 focus:ring-gray-900 focus:bg-white
                    transition-all text-[15px]"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-gray-600 px-1 flex items-center gap-1">
                  {/* <WonIcon className="w-3 h-3" /> */}
                  가격
                </label>
                <input
                  type="number"
                  value={form.price}
                  onChange={handleChange("price")}
                  min="0"
                  placeholder="0"
                  className="w-full px-3 py-3 bg-gray-50 border-0 rounded-lg
                    focus:outline-none focus:ring-1 focus:ring-gray-900 focus:bg-white
                    transition-all text-[15px] placeholder:text-gray-400"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-gray-600 px-1">
                  초기수량
                </label>
                <input
                  type="number"
                  value={form.qty}
                  onChange={handleChange("qty")}
                  min="0"
                  placeholder="0"
                  className="w-full px-3 py-3 bg-gray-50 border-0 rounded-lg
                    focus:outline-none focus:ring-1 focus:ring-gray-900 focus:bg-white
                    transition-all text-[15px] placeholder:text-gray-400"
                />
              </div>
            </div>

            {/* 입고일 */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-gray-600 px-1">
                입고일
              </label>
              <input
                type="date"
                value={form.receivedDate}
                onChange={handleChange("receivedDate")}
                className="w-full px-4 py-3 bg-gray-50 border-0 rounded-lg
                  focus:outline-none focus:ring-1 focus:ring-gray-900 focus:bg-white
                  transition-all text-[15px]"
              />
            </div>
          </section>

          {/* 구분선 */}
          <div className="border-t border-gray-100" />

          {/* 상품 이미지 섹션 */}
          <section className="space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">
                상품 이미지
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                {uploadedImages.length}/5개 업로드됨
              </p>
            </div>

            <ImageUploader
              itemId="new-item-temp"
              onImageUploaded={handleImageUploaded}
            />

            {uploadedImages.length > 0 && (
              <ImageGallery
                images={uploadedImages}
                onSetPrimary={handleSetPrimaryImage}
                onDelete={handleDeleteImage}
              />
            )}
          </section>

          {/* 구분선 */}
          <div className="border-t border-gray-100" />

          {/* 고급 옵션 토글 - 매우 심플 */}
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full flex items-center justify-between px-1 py-2
              text-sm font-medium text-gray-900 hover:text-gray-600 
              transition-colors"
          >
            <div className="flex items-center gap-2">
              <Settings2 className="w-4 h-4" />
              <span>고급 옵션</span>
            </div>
            {showAdvanced ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

          {/* 고급 옵션 - 애니메이션 없이 심플하게 */}
          {showAdvanced && (
            <section className="space-y-5 pt-2">
              {/* 유통기한 */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-gray-600 px-1">
                  유통기한
                </label>
                <input
                  type="date"
                  value={form.expiryDate}
                  onChange={handleChange("expiryDate")}
                  className="w-full px-4 py-3 bg-gray-50 border-0 rounded-lg
                    focus:outline-none focus:ring-1 focus:ring-gray-900 focus:bg-white
                    transition-all text-[15px]"
                />
              </div>

              {/* 배치번호 */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-gray-600 px-1">
                  배치번호/로트번호
                </label>
                <input
                  type="text"
                  value={form.batchNumber}
                  onChange={handleChange("batchNumber")}
                  placeholder="LOT-2024-001"
                  className="w-full px-4 py-3 bg-gray-50 border-0 rounded-lg
                    focus:outline-none focus:ring-1 focus:ring-gray-900 focus:bg-white
                    transition-all text-[15px] placeholder:text-gray-400"
                />
              </div>

              {/* 2열 그리드 - SKU & 바코드 */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-gray-600 px-1">
                    SKU 코드
                  </label>
                  <input
                    type="text"
                    value={form.sku}
                    onChange={handleChange("sku")}
                    placeholder="SKU-001"
                    className="w-full px-4 py-3 bg-gray-50 border-0 rounded-lg
                      focus:outline-none focus:ring-1 focus:ring-gray-900 focus:bg-white
                      transition-all text-[15px] placeholder:text-gray-400"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-gray-600 px-1">
                    바코드
                  </label>
                  <input
                    type="text"
                    value={form.barcode}
                    onChange={handleChange("barcode")}
                    placeholder="8801234567890"
                    className="w-full px-4 py-3 bg-gray-50 border-0 rounded-lg
                      focus:outline-none focus:ring-1 focus:ring-gray-900 focus:bg-white
                      transition-all text-[15px] placeholder:text-gray-400"
                  />
                </div>
              </div>
            </section>
          )}
        </form>
      </main>

      {/* 하단 고정 버튼 - 우버 스타일 */}
      <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30">
        <div className="max-w-2xl mx-auto px-4 py-4 flex gap-3">
          <Link
            to="/inventory"
            className="flex-1 px-4 py-3.5 bg-white hover:bg-gray-50 border 
              border-gray-300 rounded-lg font-medium text-[15px] text-gray-900
              transition-colors text-center"
          >
            취소
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            onClick={handleSubmit}
            className="flex-1 px-4 py-3.5 bg-gray-900 hover:bg-gray-800 
              disabled:bg-gray-400 text-white font-medium text-[15px] rounded-lg
              transition-colors disabled:cursor-not-allowed"
          >
            {isSubmitting ? "등록 중..." : "상품 등록"}
          </button>
        </div>
      </div>

      {/* 카테고리 추가 모달 */}
      <AddCategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
      />
    </div>
  );
};
