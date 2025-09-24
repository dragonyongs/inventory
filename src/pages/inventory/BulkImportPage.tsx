// src/pages/inventory/BulkImportPage.tsx
import React, { useCallback, useMemo, useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  ArrowLeft,
  Download,
  AlertTriangle,
  X,
  FileText,
  Info,
  Package,
} from "lucide-react";
import { useItemsStore } from "@/stores/itemsStore";
import { useCreateMovement } from "@/hooks/useCreateMovement";

type ParsedRow = {
  name: string;
  sku?: string;
  barcode?: string;
  qty?: number;
  minQty?: number;
  unit?: string;
  price?: number;
  expiryDate?: string;
  batchNumber?: string;
  receivedDate?: string;
  // 파싱 시 에러 정보
  _errors?: string[];
  _rowIndex?: number;
};

type FileUploadState = {
  file: File | null;
  parsing: boolean;
  error: string | null;
};

export const BulkImportPage: React.FC = () => {
  const navigate = useNavigate();
  const addItem = useItemsStore((s) => s.addItem);
  const createMovement = useCreateMovement();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploadState, setUploadState] = useState<FileUploadState>({
    file: null,
    parsing: false,
    error: null,
  });
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [importing, setImporting] = useState(false);

  // 템플릿 파일 다운로드
  const downloadTemplate = useCallback(() => {
    const csvContent = [
      "name,sku,barcode,qty,minQty,unit,price,expiryDate,batchNumber,receivedDate",
      "사과,FRUIT-001,1234567890123,50,10,EA,1000,2025-12-31,LOT-001,2025-09-24",
      "노트북,LAPTOP-002,9876543210987,5,2,EA,1500000,,BATCH-A,2025-09-24",
      "세제,CLEAN-003,5555555555555,20,5,EA,3000,2026-06-30,,2025-09-24",
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "inventory_template.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, []);

  // CSV 파싱 함수
  const parseCSV = useCallback((text: string): ParsedRow[] => {
    const lines = text.trim().split("\n");
    if (lines.length < 2) throw new Error("CSV 파일에 데이터가 없습니다");

    const headers = lines[0].split(",").map((h) => h.trim());
    const requiredHeaders = ["name"];
    const missingHeaders = requiredHeaders.filter((h) => !headers.includes(h));
    if (missingHeaders.length > 0) {
      throw new Error(
        `필수 헤더가 누락되었습니다: ${missingHeaders.join(", ")}`
      );
    }

    return lines.slice(1).map((line, index) => {
      const values = line.split(",").map((v) => v.trim());
      const row: ParsedRow = { name: "", _errors: [], _rowIndex: index + 2 };

      headers.forEach((header, i) => {
        const value = values[i] || "";
        switch (header) {
          case "name":
            row.name = value;
            if (!value) row._errors?.push("상품명은 필수입니다");
            break;
          case "sku":
            row.sku = value || undefined;
            break;
          case "barcode":
            row.barcode = value || undefined;
            break;
          case "qty":
            row.qty = value ? parseInt(value, 10) : 0;
            if (value && isNaN(row.qty))
              row._errors?.push("수량은 숫자여야 합니다");
            break;
          case "minQty":
            row.minQty = value ? parseInt(value, 10) : 0;
            if (value && isNaN(row.minQty))
              row._errors?.push("최소재고는 숫자여야 합니다");
            break;
          case "price":
            row.price = value ? parseFloat(value) : undefined;
            if (value && isNaN(row.price!))
              row._errors?.push("가격은 숫자여야 합니다");
            break;
          case "unit":
            row.unit = value || "EA";
            break;
          case "expiryDate":
            row.expiryDate = value || undefined;
            if (value && !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
              row._errors?.push("유통기한은 YYYY-MM-DD 형식이어야 합니다");
            }
            break;
          case "batchNumber":
            row.batchNumber = value || undefined;
            break;
          case "receivedDate":
            row.receivedDate = value || new Date().toISOString().split("T")[0];
            if (value && !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
              row._errors?.push("입고일은 YYYY-MM-DD 형식이어야 합니다");
            }
            break;
        }
      });

      return row;
    });
  }, []);

  // 파일 업로드 처리
  const handleFileUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setUploadState({ file, parsing: true, error: null });

      try {
        const text = await file.text();
        const parsedRows = parseCSV(text);
        setRows(parsedRows);
        setStep(2);
        setUploadState({ file, parsing: false, error: null });
      } catch (error) {
        setUploadState({
          file,
          parsing: false,
          error:
            error instanceof Error
              ? error.message
              : "파일 파싱 중 오류가 발생했습니다",
        });
        setRows([]);
      }
    },
    [parseCSV]
  );

  // 일괄 적용
  const handleBulkApply = useCallback(async () => {
    setImporting(true);

    try {
      const validRows = rows.filter(
        (row) => !row._errors || row._errors.length === 0
      );

      for (const row of validRows) {
        // 1. 아이템 생성
        const item = addItem({
          name: row.name,
          sku: row.sku,
          barcode: row.barcode,
          minStock: row.minQty || 0,
          defaultPrice: row.price,
          stock: 0, // 초기값 0
          expiryDate: row.expiryDate,
          batchNumber: row.batchNumber,
          receivedDate: row.receivedDate,
        });

        // 2. 초기 수량이 있으면 입고 처리
        if (row.qty && row.qty > 0) {
          await createMovement({
            type: "IN",
            itemId: item.id,
            qty: row.qty,
            reason: "일괄 업로드",
          });
        }
      }

      navigate("/inventory", { replace: true });
    } catch (error) {
      console.error("일괄 적용 실패:", error);
      setUploadState((prev) => ({
        ...prev,
        error: "일괄 적용 중 오류가 발생했습니다",
      }));
    } finally {
      setImporting(false);
    }
  }, [rows, addItem, createMovement, navigate]);

  // 통계 계산
  const stats = useMemo(() => {
    const total = rows.length;
    const valid = rows.filter(
      (row) => !row._errors || row._errors.length === 0
    ).length;
    const errors = total - valid;
    return { total, valid, errors };
  }, [rows]);

  const canNext = useMemo(() => {
    if (step === 1) return rows.length > 0;
    if (step === 2) return rows.length > 0;
    return stats.valid > 0;
  }, [step, rows.length, stats.valid]);

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      {/* 헤더 */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="w-6 h-6 text-emerald-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">일괄 업로드</h1>
              <p className="text-gray-600">
                CSV 파일로 여러 상품을 한 번에 등록하세요
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

      {/* 메인 콘텐츠 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        {/* 진행 단계 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              업로드 진행 단계
            </h2>
            <span className="text-sm text-gray-500">단계 {step}/3</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Step 1: 파일 선택 */}
            <div
              className={`p-4 rounded-lg border-2 transition-all ${
                step === 1
                  ? "border-emerald-300 bg-emerald-50 ring-2 ring-emerald-100"
                  : step > 1
                  ? "border-green-200 bg-green-50"
                  : "border-gray-200 bg-gray-50"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${
                    step > 1
                      ? "bg-green-100 text-green-700"
                      : step === 1
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {step > 1 ? "✓" : "1"}
                </div>
                <h3 className="font-medium text-gray-900">파일 선택</h3>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                CSV 파일을 업로드하세요
              </p>
              {step === 1 && (
                <div className="space-y-2">
                  <button
                    onClick={downloadTemplate}
                    className="w-full flex items-center justify-center gap-2 py-2 text-sm text-emerald-700 bg-emerald-100 rounded hover:bg-emerald-200"
                  >
                    <Download className="w-4 h-4" />
                    템플릿 다운로드
                  </button>
                  <label className="w-full flex items-center justify-center gap-2 py-2 text-sm bg-white border border-gray-300 rounded cursor-pointer hover:bg-gray-50">
                    <Upload className="w-4 h-4" />
                    파일 선택
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </label>
                </div>
              )}
              {uploadState.file && (
                <div className="mt-2 text-xs text-gray-600">
                  📎 {uploadState.file.name}
                </div>
              )}
            </div>

            {/* Step 2: 매핑 확인 */}
            <div
              className={`p-4 rounded-lg border-2 transition-all ${
                step === 2
                  ? "border-emerald-300 bg-emerald-50 ring-2 ring-emerald-100"
                  : step > 2
                  ? "border-green-200 bg-green-50"
                  : "border-gray-200 bg-gray-50 opacity-60"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${
                    step > 2
                      ? "bg-green-100 text-green-700"
                      : step === 2
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {step > 2 ? "✓" : "2"}
                </div>
                <h3 className="font-medium text-gray-900">데이터 검증</h3>
              </div>
              <p className="text-sm text-gray-600 mb-2">
                데이터 형식을 확인하세요
              </p>
              {step >= 2 && (
                <div className="text-xs space-y-1">
                  <div className="text-green-600">✓ 총 {stats.total}행</div>
                  <div className="text-green-600">✓ 유효 {stats.valid}행</div>
                  {stats.errors > 0 && (
                    <div className="text-red-600">⚠ 오류 {stats.errors}행</div>
                  )}
                </div>
              )}
            </div>

            {/* Step 3: 적용 */}
            <div
              className={`p-4 rounded-lg border-2 transition-all ${
                step === 3
                  ? "border-emerald-300 bg-emerald-50 ring-2 ring-emerald-100"
                  : "border-gray-200 bg-gray-50 opacity-60"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${
                    step === 3
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  3
                </div>
                <h3 className="font-medium text-gray-900">적용</h3>
              </div>
              <p className="text-sm text-gray-600 mb-2">상품을 등록합니다</p>
              {step === 3 && stats.valid > 0 && (
                <div className="flex items-center gap-1 text-emerald-600 text-xs">
                  <CheckCircle2 className="w-4 h-4" />
                  {stats.valid}건 적용 준비됨
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 에러 표시 */}
        {uploadState.error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-red-900 mb-1">
                  파일 업로드 오류
                </h4>
                <p className="text-sm text-red-700">{uploadState.error}</p>
              </div>
              <button
                onClick={() =>
                  setUploadState((prev) => ({ ...prev, error: null }))
                }
                className="ml-auto text-red-600 hover:text-red-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* 파싱 중 로딩 */}
        {uploadState.parsing && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-blue-800">파일을 분석하는 중...</span>
            </div>
          </div>
        )}

        {/* 데이터 프리뷰 */}
        {step >= 2 && rows.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              데이터 프리뷰
            </h3>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        행
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        상품명
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        SKU
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        수량
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        최소재고
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        단위
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        상태
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {rows.slice(0, 10).map((row, index) => {
                      const hasErrors = row._errors && row._errors.length > 0;
                      return (
                        <tr
                          key={index}
                          className={hasErrors ? "bg-red-50" : undefined}
                        >
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {row._rowIndex}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {row.name}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {row.sku || "-"}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {row.qty || 0}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {row.minQty || 0}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {row.unit || "EA"}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {hasErrors ? (
                              <div className="flex items-center gap-1 text-red-600">
                                <AlertTriangle className="w-4 h-4" />
                                <span>오류</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 text-green-600">
                                <CheckCircle2 className="w-4 h-4" />
                                <span>정상</span>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {rows.length > 10 && (
                <div className="bg-gray-50 px-4 py-3 text-sm text-gray-500 text-center">
                  ... 외 {rows.length - 10}개 행 더
                </div>
              )}
            </div>
          </div>
        )}

        {/* 오류 상세 */}
        {step >= 2 && stats.errors > 0 && (
          <div className="mb-6">
            <h4 className="text-md font-semibold text-red-900 mb-3 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              오류 상세 ({stats.errors}건)
            </h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {rows
                .filter((row) => row._errors && row._errors.length > 0)
                .slice(0, 5)
                .map((row, index) => (
                  <div
                    key={index}
                    className="p-3 bg-red-50 border border-red-200 rounded text-sm"
                  >
                    <div className="font-medium text-red-900">
                      행 {row._rowIndex}: {row.name || "(이름 없음)"}
                    </div>
                    <ul className="mt-1 text-red-700">
                      {row._errors?.map((error, i) => (
                        <li key={i}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* 액션 버튼 */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <button
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50"
            onClick={() => {
              if (step > 1) {
                setStep((s) => (s - 1) as 1 | 2 | 3);
              }
            }}
            disabled={step === 1}
          >
            이전
          </button>
          <div className="flex items-center gap-3">
            {step < 3 && (
              <button
                className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 text-sm"
                onClick={() => setStep((s) => (s + 1) as 1 | 2 | 3)}
                disabled={!canNext}
              >
                다음
              </button>
            )}
            {step === 3 && (
              <button
                className="flex items-center gap-2 px-6 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
                disabled={stats.valid === 0 || importing}
                onClick={handleBulkApply}
              >
                {importing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    적용 중...
                  </>
                ) : (
                  <>
                    <Package className="w-4 h-4" />
                    {stats.valid}건 상품 등록
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 도움말 */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-2">업로드 가이드</h3>
            <div className="text-sm text-blue-800 space-y-2">
              <p>
                • <strong>템플릿 다운로드</strong>: 올바른 형식을 확인하기 위해
                템플릿을 다운로드하세요
              </p>
              <p>
                • <strong>필수 필드</strong>: name(상품명)은 반드시 입력해야
                합니다
              </p>
              <p>
                • <strong>날짜 형식</strong>: 날짜는 YYYY-MM-DD 형식으로
                입력하세요 (예: 2025-12-31)
              </p>
              <p>
                • <strong>숫자 필드</strong>: qty, minQty, price는 숫자만 입력
                가능합니다
              </p>
              <p>
                • <strong>파일 형식</strong>: CSV 파일만 지원합니다 (UTF-8
                인코딩 권장)
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
