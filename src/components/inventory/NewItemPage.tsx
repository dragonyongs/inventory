// src/pages/inventory/NewItemPage.tsx
import React, { useCallback, useMemo, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  PackagePlus,
  Plus,
  Folder,
  ChevronDown,
  Package,
  Barcode,
  DollarSign,
  Calendar,
  Hash,
  Tag,
} from "lucide-react";
import { z } from "zod";
import { useItemsStore } from "@/stores/itemsStore";
import { useCreateMovement } from "@/hooks/useCreateMovement";
import { useCategoriesStore } from "@/stores/categoriesStore";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { AddCategoryModal } from "@/components/inventory/AddCategoryModal";
import { ImageUploader } from "@/components/inventory/ImageUploader";
import { ImageGallery } from "@/components/inventory/ImageGallery";
import type { ItemImage } from "@/types/image";
import { useMediaQuery } from "@/hooks/useMediaQuery";

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
  const isMobile = useMediaQuery("(max-width: 768px)");
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

  // 이미지 업로드 핸들러 추가
  const handleImageUploaded = useCallback((image: ItemImage) => {
    setUploadedImages((prev) => {
      const isPrimary = prev.length === 0;
      return [...prev, { ...image, isPrimary }];
    });
  }, []);

  // 대표 이미지 설정 핸들러
  const handleSetPrimaryImage = useCallback((imageId: string) => {
    setUploadedImages((prev) =>
      prev.map((img) => ({
        ...img,
        isPrimary: img.id === imageId,
      }))
    );
  }, []);

  // 이미지 삭제 핸들러
  const handleDeleteImage = useCallback((imageId: string) => {
    setUploadedImages((prev) => prev.filter((img) => img.id !== imageId));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // const primaryImage = uploadedImages.find((img) => img.isPrimary);

    const result = schema.safeParse(form);
    if (!result.success) {
      // ✅ 타입을 명시적으로 지정
      const newErrors: Partial<Record<keyof FormData, string>> = {};

      // ✅ Zod 에러 처리 - issues 속성 사용
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* 헤더 */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between px-4 py-3 max-w-7xl mx-auto">
          <Link
            to="/inventory"
            className="flex items-center gap-2 text-gray-700 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className={isMobile ? "text-sm" : "text-base"}>
              {isMobile ? "목록" : "목록으로"}
            </span>
          </Link>
          {/* 모바일에서만 제목 표시 */}
          {isMobile && (
            <h1 className="text-lg font-semibold text-gray-900">
              새 상품 등록
            </h1>
          )}
          <div className="w-20" /> {/* 균형을 위한 spacer */}
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* 타이틀 섹션 */}
          {/* <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg shadow-blue-500/25">
              <PackagePlus className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
              새 상품 등록
            </h1>
            <p className="text-gray-500 text-sm sm:text-base">
              상품을 등록하고 재고를 효율적으로 관리하세요
            </p>
          </div> */}

          {!isMobile && (
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-2xl mb-4">
                <PackagePlus className="w-8 h-8 text-blue-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">새 상품 등록</h1>
              <p className="text-gray-600">
                상품을 등록하고 재고를 효율적으로 관리하세요
              </p>
            </div>
          )}

          {/* 기본 정보 카드 */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-xl">
                  <Package className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">기본 정보</h2>
                  <p className="text-sm text-gray-500 mt-0.5">
                    필수 입력 항목입니다
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* 카테고리 선택 */}
              {categories.length > 0 && (
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    카테고리{" "}
                    <span className="text-gray-400 font-normal">(선택)</span>
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Folder className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                      <select
                        value={form.categoryId}
                        onChange={handleChange("categoryId")}
                        className="w-full h-12 pl-12 pr-10 bg-gray-50 border-0 rounded-xl
                                 text-sm font-medium text-gray-900
                                 focus:ring-2 focus:ring-blue-500 focus:bg-white
                                 transition-all duration-200 appearance-none cursor-pointer"
                      >
                        <option value="">카테고리 선택</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.icon && `${cat.icon} `}
                            {cat.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsCategoryModalOpen(true)}
                      className="flex items-center justify-center w-12 h-12 bg-blue-600 
                               hover:bg-blue-700 rounded-xl transition-colors duration-200
                               shadow-sm hover:shadow-md"
                      title="카테고리 추가"
                    >
                      <Plus className="w-5 h-5 text-white" />
                    </button>
                  </div>
                </div>
              )}

              {/* 상품명 */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  상품명 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={handleChange("name")}
                  placeholder="상품명을 입력하세요 (예: 등록 컴포트 상품)"
                  className={`w-full h-14 px-4 bg-gray-50 border-0 rounded-xl
                           text-base font-medium text-gray-900 placeholder:text-gray-400
                           focus:ring-2 focus:ring-blue-500 focus:bg-white
                           transition-all duration-200
                           ${errors.name ? "ring-2 ring-red-500" : ""}`}
                />
                {errors.name && (
                  <p className="mt-2 text-sm text-red-600 font-medium">
                    {errors.name}
                  </p>
                )}
              </div>

              {/* 2열 그리드 - 최소재고, 가격, 초기수량 */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    최소 재고
                  </label>
                  <div className="relative">
                    <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                    <input
                      type="number"
                      value={form.minStock}
                      onChange={handleChange("minStock")}
                      placeholder="0"
                      min="0"
                      className="w-full h-12 pl-12 pr-4 bg-gray-50 border-0 rounded-xl
                               text-sm font-medium text-gray-900 placeholder:text-gray-400
                               focus:ring-2 focus:ring-blue-500 focus:bg-white
                               transition-all duration-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    가격
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                    <input
                      type="number"
                      value={form.price}
                      onChange={handleChange("price")}
                      placeholder="0"
                      min="0"
                      step="0.01"
                      className="w-full h-12 pl-12 pr-4 bg-gray-50 border-0 rounded-xl
                               text-sm font-medium text-gray-900 placeholder:text-gray-400
                               focus:ring-2 focus:ring-blue-500 focus:bg-white
                               transition-all duration-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    초기 수량
                  </label>
                  <div className="relative">
                    <Package className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                    <input
                      type="number"
                      value={form.qty}
                      onChange={handleChange("qty")}
                      placeholder="0"
                      min="0"
                      className="w-full h-12 pl-12 pr-4 bg-gray-50 border-0 rounded-xl
                               text-sm font-medium text-gray-900 placeholder:text-gray-400
                               focus:ring-2 focus:ring-blue-500 focus:bg-white
                               transition-all duration-200"
                    />
                  </div>
                </div>
              </div>

              {/* 입고일 */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  입고일 <span className="text-blue-600">(오늘)</span>
                </label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  <input
                    type="date"
                    value={form.receivedDate}
                    onChange={handleChange("receivedDate")}
                    className="w-full h-12 pl-12 pr-4 bg-gray-50 border-0 rounded-xl
                             text-sm font-medium text-gray-900
                             focus:ring-2 focus:ring-blue-500 focus:bg-white
                             transition-all duration-200"
                  />
                </div>
              </div>

              <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Package className="w-4 h-4" />
                  상품 이미지
                </label>

                {/* 이미지 업로더 */}
                <ImageUploader
                  itemId="temp-new-item"
                  onImageUploaded={handleImageUploaded}
                  currentImagesCount={uploadedImages.length}
                  maxImages={5}
                />

                {/* 업로드된 이미지 갤러리 */}
                {uploadedImages.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs text-gray-500 mb-2">
                      업로드된 이미지 ({uploadedImages.length}개)
                    </p>
                    <ImageGallery
                      images={uploadedImages}
                      onSetPrimary={handleSetPrimaryImage}
                      onDelete={handleDeleteImage}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 고급 옵션 토글 */}
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full flex items-center justify-between p-4 bg-white rounded-xl
                     border border-gray-200 hover:border-gray-300 transition-colors duration-200"
          >
            <span className="text-sm font-semibold text-gray-700">
              고급 옵션 {showAdvanced ? "숨기기" : "보기"}
            </span>
            <ChevronDown
              className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
                showAdvanced ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* 고급 옵션 카드 */}
          {showAdvanced && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      유통기한
                    </label>
                    <input
                      type="date"
                      value={form.expiryDate}
                      onChange={handleChange("expiryDate")}
                      className="w-full h-12 px-4 bg-gray-50 border-0 rounded-xl
                               text-sm font-medium text-gray-900
                               focus:ring-2 focus:ring-blue-500 focus:bg-white
                               transition-all duration-200"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      배치번호/로트번호
                    </label>
                    <input
                      type="text"
                      value={form.batchNumber}
                      onChange={handleChange("batchNumber")}
                      placeholder="LOT-20250924"
                      className="w-full h-12 px-4 bg-gray-50 border-0 rounded-xl
                               text-sm font-medium text-gray-900 placeholder:text-gray-400
                               focus:ring-2 focus:ring-blue-500 focus:bg-white
                               transition-all duration-200"
                    />
                  </div>
                </div>

                {/* 2열 그리드 - SKU & 바코드 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      SKU 코드
                    </label>
                    <div className="relative">
                      <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                      <input
                        type="text"
                        value={form.sku}
                        onChange={handleChange("sku")}
                        placeholder="APP-001"
                        className="w-full h-12 pl-12 pr-4 bg-gray-50 border-0 rounded-xl
                               text-sm font-medium text-gray-900 placeholder:text-gray-400
                               focus:ring-2 focus:ring-blue-500 focus:bg-white
                               transition-all duration-200"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      바코드
                    </label>
                    <div className="relative">
                      <Barcode className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                      <input
                        type="text"
                        value={form.barcode}
                        onChange={handleChange("barcode")}
                        placeholder="8801234567890"
                        className="w-full h-12 pl-12 pr-4 bg-gray-50 border-0 rounded-xl
                               text-sm font-medium text-gray-900 placeholder:text-gray-400
                               focus:ring-2 focus:ring-blue-500 focus:bg-white
                               transition-all duration-200"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 제출 버튼 */}
          <div className="flex gap-3 pt-4">
            <Link
              to="/inventory"
              className="flex-1 sm:flex-none sm:px-8 h-14 inline-flex items-center justify-center
                       bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl
                       transition-colors duration-200"
            >
              취소
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 sm:flex-none sm:px-8 h-14 inline-flex items-center justify-center gap-2
                       bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800
                       text-white font-bold rounded-xl
                       shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30
                       transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <PackagePlus className="w-5 h-5" />
              {isSubmitting ? "등록 중..." : "상품 등록"}
            </button>
          </div>
        </form>
      </main>

      {/* 카테고리 추가 모달 */}
      <AddCategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
      />
    </div>
  );
};
