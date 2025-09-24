// src/pages/inventory/NewItemPage.tsx
import React, { useCallback, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, PackagePlus, Plus } from "lucide-react";
import { z } from "zod";
import { useItemsStore } from "@/stores/itemsStore";
import { useCreateMovement } from "@/hooks/useCreateMovement";

// Inventory AddItemForm과 동일한 스키마
const schema = z.object({
  name: z.string().min(1, "상품명을 입력하세요"),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  minStock: z.coerce.number().min(0).default(0),
  price: z.coerce.number().min(0).optional(),
  qty: z.coerce.number().min(0).default(0),
  expiryDate: z.string().optional(), // YYYY-MM-DD
  batchNumber: z.string().optional(),
  receivedDate: z.string().optional(), // YYYY-MM-DD
});

type FormData = z.infer<typeof schema>;

export const NewItemPage: React.FC = () => {
  const navigate = useNavigate();
  const addItem = useItemsStore((s) => s.addItem);
  const hasSku = useItemsStore((s) => s.hasSku);
  const createMovement = useCreateMovement();

  const [data, setData] = useState<FormData>({
    name: "",
    sku: "",
    barcode: "",
    minStock: 0,
    price: 0,
    qty: 0,
    expiryDate: "",
    batchNumber: "",
    receivedDate: new Date().toISOString().split("T")[0], // 오늘 날짜 기본값
  });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValid = useMemo(
    () => schema.safeParse(data).success && data.name.trim(),
    [data]
  );

  const onChange = useCallback(
    <K extends keyof FormData>(key: K, value: FormData[K]) => {
      setData((d) => ({ ...d, [key]: value }));
    },
    []
  );

  // Inventory AddItemForm과 정확히 동일한 로직
  const handleSave = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setSaving(true);

      console.log("📝 저장 시작:", data);

      // 유효성 검증
      if (!data.name.trim()) {
        setError("상품명을 입력하세요.");
        setSaving(false);
        return;
      }

      if (data.sku?.trim() && hasSku(data.sku.trim())) {
        setError("이미 사용 중인 SKU입니다.");
        setSaving(false);
        return;
      }

      try {
        // 1. 아이템 생성
        console.log("🔄 addItem 호출 중...");
        const item = addItem({
          name: data.name.trim(),
          sku: data.sku?.trim() || undefined,
          barcode: data.barcode?.trim() || undefined,
          minStock: typeof data.minStock === "number" ? data.minStock : 0,
          defaultPrice: typeof data.price === "number" ? data.price : undefined,
          stock: 0, // 초기값 0으로 설정
          category: undefined,
          expiryDate: data.expiryDate || undefined,
          batchNumber: data.batchNumber?.trim() || undefined,
          receivedDate: data.receivedDate || undefined,
        });

        console.log("✅ 아이템 생성 완료:", {
          itemId: item.id,
          name: item.name,
          initialStock: item.stock,
          inputQuantity: data.qty,
        });

        // 2. 초기 수량이 있으면 입고 이동 생성
        const qty = typeof data.qty === "number" ? data.qty : 0;
        if (qty > 0) {
          console.log("🔄 createMovement 호출 중:", {
            type: "IN",
            itemId: item.id,
            qty,
            reason: "초기 재고",
          });

          try {
            const result = await createMovement({
              type: "IN",
              itemId: item.id,
              qty,
              reason: "초기 재고",
            });

            console.log("✅ createMovement 완료:", result);
          } catch (movementError) {
            console.error("❌ createMovement 실패:", movementError);
            // 이동 생성 실패해도 아이템은 이미 생성됨을 알림
            setError(
              `아이템은 생성되었지만 재고 이동 생성에 실패했습니다: ${movementError}`
            );
            setSaving(false);
            return;
          }
        } else {
          console.log("ℹ️  초기 수량이 0이므로 createMovement 건너뜀");
        }

        console.log("🎉 전체 과정 완료, 페이지 이동");

        // 성공 후 인벤토리로 이동
        navigate("/inventory", { replace: true });
      } catch (error) {
        console.error("❌ 전체 과정 실패:", error);
        setError(
          `저장 중 오류가 발생했습니다: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      } finally {
        setSaving(false);
      }
    },
    [data, addItem, hasSku, createMovement, navigate]
  );

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      {/* 헤더 */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <PackagePlus className="w-6 h-6 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                신규 상품 추가
              </h1>
              <p className="text-gray-600">
                상품을 등록하여 재고를 효율적으로 관리하세요
              </p>
            </div>
          </div>
          <Link
            to="/inventory"
            className="inline-flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4" />
            인벤토리로
          </Link>
        </div>
      </div>

      {/* 폼: Inventory AddItemForm과 동일한 구조 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
          <Plus className="w-5 h-5 mr-2 text-blue-600" />새 품목 추가
        </h3>

        <form onSubmit={handleSave} className="space-y-6">
          <div className="space-y-4">
            {/* 기본 정보 섹션 */}
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-gray-900 flex items-center">
                <PackagePlus className="w-4 h-4 mr-2 text-blue-600" />
                기본 정보
              </h4>
              <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                필수
              </span>
            </div>

            {/* 상품명 (전체 너비) */}
            <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  상품명 <span className="text-red-500">*</span>
                </label>
                <input
                  value={data.name}
                  onChange={(e) => onChange("name", e.target.value)}
                  placeholder="예: 사과, 노트북, 세제..."
                  required={true}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors border-blue-200 bg-blue-50/30"
                />
              </div>
            </div>

            {/* 4열 그리드: 최소 재고, 가격, 초기 수량, 입고일 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  최소 재고
                </label>
                <input
                  value={data.minStock}
                  onChange={(e) => onChange("minStock", e.target.value as any)}
                  placeholder="10"
                  type="number"
                  min={0}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  가격
                </label>
                <input
                  value={data.price ?? ""}
                  onChange={(e) => onChange("price", e.target.value as any)}
                  placeholder="1000"
                  type="number"
                  step={0.01}
                  min={0}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  초기 수량
                </label>
                <input
                  value={data.qty}
                  onChange={(e) => onChange("qty", e.target.value as any)}
                  placeholder="100"
                  type="number"
                  min={0}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  입고일 <span className="text-blue-500 text-xs">(선택)</span>
                </label>
                <input
                  value={data.receivedDate ?? ""}
                  onChange={(e) => onChange("receivedDate", e.target.value)}
                  type="date"
                  required={true}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                />
              </div>
            </div>
          </div>

          {/* 추가 옵션 토글 */}
          <div className="border-t border-gray-200 pt-4">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              <PackagePlus className="w-4 h-4 mr-2" />
              추가 옵션 보기 (식별정보, 품질관리)
              <span className="ml-2 text-xs text-gray-400">
                {showAdvanced ? "숨기기" : "보기"}
              </span>
              {showAdvanced ? (
                <ArrowLeft className="w-4 h-4 ml-auto rotate-90" />
              ) : (
                <Plus className="w-4 h-4 ml-auto" />
              )}
            </button>
          </div>

          {/* 확장 옵션 */}
          {showAdvanced && (
            <div className="space-y-6 bg-gray-50 rounded-lg p-4">
              {/* 식별정보 섹션 */}
              <div className="space-y-4">
                <div className="flex items-center">
                  <h4 className="text-sm font-medium text-gray-700 flex items-center">
                    SKU/바코드
                  </h4>
                  <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded-full ml-2">
                    선택
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">
                      SKU
                    </label>
                    <input
                      value={data.sku ?? ""}
                      onChange={(e) => onChange("sku", e.target.value)}
                      placeholder="APP-001"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* 품질관리 섹션 */}
              <div className="space-y-4">
                <div className="flex items-center">
                  <h4 className="text-sm font-medium text-gray-700 flex items-center">
                    품질관리
                  </h4>
                  <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded-full ml-2">
                    선택
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">
                      유통기한
                    </label>
                    <input
                      value={data.expiryDate ?? ""}
                      onChange={(e) => onChange("expiryDate", e.target.value)}
                      type="date"
                      placeholder="2024-12-31"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">
                      배치 번호
                    </label>
                    <input
                      value={data.batchNumber ?? ""}
                      onChange={(e) => onChange("batchNumber", e.target.value)}
                      placeholder="LOT-20250923"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500 flex items-start">
                  유통기한과 배치 번호를 설정하면 만료 관리가 가능합니다.
                </p>
              </div>
            </div>
          )}

          {/* 에러 표시 */}
          {error && (
            <div className="flex-1">
              <div className="flex items-center text-red-600 text-sm">
                <PackagePlus className="w-4 h-4 mr-1" />
                {error}
              </div>
            </div>
          )}

          {/* 저장 버튼 */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div className="flex-1">
              {error && (
                <div className="flex items-center text-red-600 text-sm">
                  <PackagePlus className="w-4 h-4 mr-1" />
                  {error}
                </div>
              )}
            </div>
            <button
              type="submit"
              disabled={saving || !isValid}
              className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              {saving ? "저장 중..." : "품목 추가"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
