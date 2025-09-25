// src/pages/inventory/NewItemPage.tsx
import React, { useCallback, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, PackagePlus, Plus } from "lucide-react";
import { z } from "zod";
import { useItemsStore } from "@/stores/itemsStore";
import { useCreateMovement } from "@/hooks/useCreateMovement";

// zod 스키마 (coerce로 숫자 변환)
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
});

type FormData = z.infer<typeof schema>;

export const NewItemPage: React.FC = () => {
  const navigate = useNavigate();
  const addItem = useItemsStore((s) => s.addItem);
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
    receivedDate: new Date().toISOString().split("T")[0],
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

  const handleSave = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setSaving(true);

      const parsed = schema.safeParse(data);
      if (!parsed.success) {
        setError(parsed.error.issues[0]?.message ?? "입력값을 확인하세요");
        setSaving(false);
        return;
      }

      try {
        const { qty, minStock, price, ...otherData } = parsed.data;

        const item = addItem({
          ...otherData,
          minStock,
          defaultPrice: price,
          stock: 0,
        });

        if (qty > 0) {
          await createMovement({
            type: "IN",
            itemId: item.id,
            qty,
            reason: "초기 재고",
          });
        }

        navigate("/inventory", { replace: true });
      } catch (error) {
        console.error("저장 실패:", error);
        setError(`저장 중 오류가 발생했습니다: ${String(error)}`);
      } finally {
        setSaving(false);
      }
    },
    [data, addItem, createMovement, navigate]
  );

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
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

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
          <Plus className="w-5 h-5 mr-2 text-blue-600" />새 품목 추가
        </h3>

        <form onSubmit={handleSave} className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-gray-900 flex items-center">
                <PackagePlus className="w-4 h-4 mr-2 text-blue-600" />
                기본 정보
              </h4>
              <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                필수
              </span>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                상품명 <span className="text-red-500">*</span>
              </label>
              <input
                value={data.name}
                onChange={(e) => onChange("name", e.target.value)}
                placeholder="예: 사과, 노트북, 세제..."
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

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
                  min={0}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                  step={0.01}
                  min={0}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                  min={0}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <button
              type="button"
              onClick={() => setShowAdvanced((s) => !s)}
              className="flex items-center text-sm text-gray-600 hover:text-gray-900"
            >
              <Plus className="w-4 h-4 mr-2" />
              추가 옵션 보기 (식별정보, 품질관리)
              <span className="ml-2 text-xs text-gray-400">
                {showAdvanced ? "숨기기" : "보기"}
              </span>
            </button>
          </div>

          {showAdvanced && (
            <div className="space-y-6 bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    SKU
                  </label>
                  <input
                    value={data.sku ?? ""}
                    onChange={(e) => onChange("sku", e.target.value)}
                    placeholder="APP-001"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    로트번호
                  </label>
                  <input
                    value={data.batchNumber ?? ""}
                    onChange={(e) => onChange("batchNumber", e.target.value)}
                    placeholder="LOT-20250924"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div className="text-sm text-red-600">{error}</div>
            <button
              type="submit"
              disabled={!isValid || saving}
              className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}{" "}
              저장
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
