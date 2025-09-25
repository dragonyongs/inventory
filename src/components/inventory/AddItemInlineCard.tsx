// src/components/inventory/AddItemInlineCard.tsx
import React from "react";

export type AddItemFormState = {
  name: string;
  sku: string;
  barcode: string;
  minStock: number | "";
  price: number | ""; // 폼 표현용만 사용(스토어 저장 시 제거)
  qty: number | ""; // 초기 입고 수량
  receivedDate: string;
  expiryDate: string;
  batchNumber: string;
};

const DEFAULT_FORM: AddItemFormState = {
  name: "",
  sku: "",
  barcode: "",
  minStock: 0,
  price: "",
  qty: "",
  receivedDate: new Date().toISOString().slice(0, 10),
  expiryDate: "",
  batchNumber: "",
};

interface Props {
  value?: AddItemFormState; // 안전 기본값 허용
  onChange?: <K extends keyof AddItemFormState>(
    key: K,
    v: AddItemFormState[K]
  ) => void;
  onSubmit?: () => void;
  submitting?: boolean;
}

export const AddItemInlineCard: React.FC<Props> = React.memo(
  ({ value, onChange, onSubmit, submitting }) => {
    const v = value ?? DEFAULT_FORM;

    return (
      <section className="rounded-xl border bg-white shadow-sm">
        <div className="flex items-center justify-between px-5 py-4">
          <div className="text-base font-semibold">새 품목 추가</div>
          <span className="text-xs text-gray-400">중요</span>
        </div>

        <div className="border-t px-5 py-5">
          <div className="mb-2 text-sm font-medium">기본 정보</div>

          <div className="grid grid-cols-12 gap-3">
            <div className="col-span-12">
              <label className="mb-1 block text-xs font-medium">상품명</label>
              <input
                value={v.name}
                onChange={(e) => onChange?.("name", e.target.value)}
                placeholder="예: 사과, 노트북, 생수…"
                className="w-full rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="col-span-12 md:col-span-3">
              <label className="mb-1 block text-xs font-medium">
                최소 재고
              </label>
              <input
                type="number"
                min={0}
                value={v.minStock}
                onChange={(e) =>
                  onChange?.("minStock", Number(e.target.value) || 0)
                }
                className="w-full rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="col-span-12 md:col-span-3">
              <label className="mb-1 block text-xs font-medium">가격</label>
              <input
                type="number"
                min={0}
                value={v.price}
                onChange={(e) =>
                  onChange?.("price", Number(e.target.value) || "")
                }
                className="w-full rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="col-span-12 md:col-span-3">
              <label className="mb-1 block text-xs font-medium">
                초기 수량
              </label>
              <input
                type="number"
                min={0}
                value={v.qty}
                onChange={(e) =>
                  onChange?.("qty", Number(e.target.value) || "")
                }
                className="w-full rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="col-span-12 md:col-span-3">
              <label className="mb-1 block text-xs font-medium">입고일</label>
              <input
                type="date"
                value={v.receivedDate}
                onChange={(e) => onChange?.("receivedDate", e.target.value)}
                className="w-full rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <details className="mt-3">
            <summary className="cursor-pointer text-xs text-gray-600">
              추가 옵션 보기 (식별정보, 품질관리)
            </summary>
            <div className="mt-3 grid grid-cols-12 gap-3">
              <div className="col-span-12 md:col-span-4">
                <label className="mb-1 block text-xs font-medium">SKU</label>
                <input
                  value={v.sku}
                  onChange={(e) => onChange?.("sku", e.target.value)}
                  className="w-full rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="col-span-12 md:col-span-4">
                <label className="mb-1 block text-xs font-medium">바코드</label>
                <input
                  value={v.barcode}
                  onChange={(e) => onChange?.("barcode", e.target.value)}
                  className="w-full rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="col-span-12 md:col-span-2">
                <label className="mb-1 block text-xs font-medium">
                  배치번호
                </label>
                <input
                  value={v.batchNumber}
                  onChange={(e) => onChange?.("batchNumber", e.target.value)}
                  className="w-full rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="col-span-12 md:col-span-2">
                <label className="mb-1 block text-xs font-medium">
                  유통기한
                </label>
                <input
                  type="date"
                  value={v.expiryDate}
                  onChange={(e) => onChange?.("expiryDate", e.target.value)}
                  className="w-full rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </details>

          <div className="mt-5 flex justify-end">
            <button
              onClick={onSubmit}
              disabled={submitting || !v.name}
              className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-60"
            >
              {submitting ? "등록 중..." : "품목 추가"}
            </button>
          </div>
        </div>
      </section>
    );
  }
);

AddItemInlineCard.displayName = "AddItemInlineCard";
