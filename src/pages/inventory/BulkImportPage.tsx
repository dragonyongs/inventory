// src/pages/inventory/BulkImportPage.tsx
import React, { useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Upload, FileSpreadsheet, CheckCircle2, ArrowLeft } from "lucide-react";
import { useItemsStore } from "@/stores/itemsStore";

type ParsedRow = {
  name: string;
  sku?: string;
  barcode?: string;
  qty?: number;
  minQty?: number;
  unit?: string;
  expiresAt?: string;
};

export const BulkImportPage: React.FC = () => {
  const navigate = useNavigate();
  const addMany = useItemsStore((s) => s.addMany); // 스토어에 대량 추가 액션이 없다면 구현 예정
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const canNext = useMemo(() => {
    if (step === 1) return rows.length > 0;
    if (step === 2) return rows.length > 0;
    return true;
  }, [step, rows.length]);

  return (
    <div className="px-4 py-4 md:px-6 md:py-6 max-w-5xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
          <h1 className="text-lg font-semibold">일괄 업로드(베타)</h1>
        </div>
        <Link
          to="/inventory"
          className="inline-flex items-center gap-1 text-sm text-gray-600 hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          인벤토리로
        </Link>
      </div>

      <div className="bg-white rounded-xl border p-4">
        <ol className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <li
            className={`p-3 rounded border ${
              step === 1 ? "ring-2 ring-emerald-100" : ""
            }`}
          >
            1. 파일 선택
            <div className="text-xs text-gray-500 mt-1">CSV/XLSX 지원 예정</div>
            <div className="mt-2">
              <label className="inline-flex items-center gap-2 px-3 py-1.5 border rounded cursor-pointer">
                <Upload className="w-4 h-4" />
                파일 선택
                <input
                  type="file"
                  accept=".csv,.xlsx"
                  className="hidden"
                  onChange={(e) => {
                    // TODO: 파일 파싱 로직 (추후)
                    // 데모용 목업 데이터
                    setRows([
                      { name: "샘플 A", qty: 10, minQty: 2, unit: "EA" },
                      { name: "샘플 B", qty: 3, minQty: 5, unit: "EA" },
                    ]);
                  }}
                />
              </label>
            </div>
          </li>

          <li
            className={`p-3 rounded border ${
              step === 2 ? "ring-2 ring-emerald-100" : ""
            }`}
          >
            2. 매핑 확인
            <div className="text-xs text-gray-500 mt-1">
              열과 필드 매핑을 검토하세요
            </div>
            <div className="mt-2 text-xs text-gray-600">
              필수 필드: name, 선택: sku, barcode, qty, minQty, unit, expiresAt
            </div>
            {/* TODO: 매핑 UI (추후) */}
          </li>

          <li
            className={`p-3 rounded border ${
              step === 3 ? "ring-2 ring-emerald-100" : ""
            }`}
          >
            3. 검증 및 적용
            <div className="text-xs text-gray-500 mt-1">
              오류 행을 수정한 후 적용
            </div>
            <div className="mt-2 flex items-center gap-2 text-emerald-600 text-sm">
              <CheckCircle2 className="w-4 h-4" />
              {rows.length}건 준비됨
            </div>
          </li>
        </ol>

        <div className="mt-4 flex items-center justify-between">
          <button
            className="px-3 py-1.5 rounded border text-sm"
            onClick={() => setStep((s) => (s > 1 ? ((s - 1) as 1 | 2 | 3) : s))}
          >
            이전
          </button>
          <div className="flex items-center gap-2">
            <button
              className="px-3 py-1.5 rounded border text-sm"
              onClick={() =>
                setStep((s) => (s < 3 ? ((s + 1) as 1 | 2 | 3) : s))
              }
              disabled={!canNext}
            >
              다음
            </button>
            <button
              className="px-3 py-1.5 rounded bg-emerald-600 text-white text-sm disabled:opacity-50"
              disabled={step !== 3 || rows.length === 0}
              onClick={() => {
                // DB 전 단계: 상태 적용만
                addMany?.(rows);
                navigate("/inventory", { replace: true });
              }}
            >
              적용
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
