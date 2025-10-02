// src/pages/BulkImportPage.tsx
import React, {
  useCallback,
  useMemo,
  useState,
  useRef,
  useEffect,
} from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  ArrowLeft,
  Download,
  AlertTriangle,
  X,
  Info,
  Package,
  Trash2,
  RefreshCw,
  Search,
  Filter,
  TrendingUp,
  AlertCircle,
  FileCheck,
  Zap,
} from "lucide-react";
import { useItemsStore } from "@/stores/itemsStore";
import { useCreateMovement } from "@/hooks/useCreateMovement";

// ============================================
// 타입 정의
// ============================================
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
  _errors?: string[];
  _warnings?: string[];
  _rowIndex?: number;
};

type FileUploadState = {
  file: File | null;
  parsing: boolean;
  error: string | null;
};

type ImportProgress = {
  current: number;
  total: number;
  percentage: number;
  status: "idle" | "processing" | "completed" | "error";
};

type FilterType = "all" | "valid" | "errors" | "warnings";

// ============================================
// 유틸리티 함수
// ============================================
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDuration = (ms: number): string => {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}초`;
  const minutes = Math.floor(seconds / 60);
  return `${minutes}분 ${seconds % 60}초`;
};

// ============================================
// 메모이제이션된 테이블 Row 컴포넌트
// ============================================
const TableRow = React.memo(
  ({
    row,
    index,
    onRemove,
  }: {
    row: ParsedRow;
    index: number;
    onRemove: (index: number) => void;
  }) => {
    const hasErrors = row._errors && row._errors.length > 0;
    const hasWarnings = row._warnings && row._warnings.length > 0;

    return (
      <tr
        className={`group transition-colors ${
          hasErrors
            ? "bg-red-50 hover:bg-red-100"
            : hasWarnings
            ? "bg-amber-50 hover:bg-amber-100"
            : "hover:bg-gray-50"
        }`}
      >
        <td className="px-4 py-3 text-sm text-gray-500">{row._rowIndex}</td>
        <td className="px-4 py-3 text-sm font-medium text-gray-900">
          {row.name}
        </td>
        <td className="px-4 py-3 text-sm text-gray-600">
          {row.sku || <span className="text-gray-400">-</span>}
        </td>
        <td className="px-4 py-3 text-sm text-gray-600 text-right">
          {row.qty || 0}
        </td>
        <td className="px-4 py-3 text-sm text-gray-600 text-right">
          {row.minQty || 0}
        </td>
        <td className="px-4 py-3 text-sm text-gray-600">{row.unit || "EA"}</td>
        <td className="px-4 py-3 text-sm text-gray-600 text-right">
          {row.price ? `₩${row.price.toLocaleString()}` : "-"}
        </td>
        <td className="px-4 py-3 text-sm">
          {hasErrors ? (
            <div className="flex items-center gap-1.5 text-red-600">
              <AlertTriangle className="w-4 h-4" />
              <span className="font-medium">오류</span>
            </div>
          ) : hasWarnings ? (
            <div className="flex items-center gap-1.5 text-amber-600">
              <AlertCircle className="w-4 h-4" />
              <span className="font-medium">경고</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-green-600">
              <CheckCircle2 className="w-4 h-4" />
              <span className="font-medium">정상</span>
            </div>
          )}
        </td>
        <td className="px-4 py-3 text-sm">
          <button
            onClick={() => onRemove(index)}
            className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition-opacity"
            title="행 제거"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </td>
      </tr>
    );
  }
);

TableRow.displayName = "TableRow";

// ============================================
// 메인 컴포넌트
// ============================================
export const BulkImportPage: React.FC = () => {
  const navigate = useNavigate();
  const addItem = useItemsStore((s) => s.addItem);
  const createMovement = useCreateMovement();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // State
  const [uploadState, setUploadState] = useState<FileUploadState>({
    file: null,
    parsing: false,
    error: null,
  });
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState<ImportProgress>({
    current: 0,
    total: 0,
    percentage: 0,
    status: "idle",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [startTime, setStartTime] = useState<number>(0);

  // 파일 크기 및 행 제한
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  const MAX_ROWS = 10000;

  // ============================================
  // 템플릿 다운로드
  // ============================================
  const downloadTemplate = useCallback(() => {
    const csvContent = [
      "name,sku,barcode,qty,minQty,unit,price,expiryDate,batchNumber,receivedDate",
      "프리미엄 사과,FRUIT-001,1234567890123,50,10,EA,1000,2025-12-31,LOT-001,2025-09-24",
      "노트북 맥북 프로,LAPTOP-002,9876543210987,5,2,EA,1500000,,BATCH-A,2025-09-24",
      "세제 프리미엄,CLEAN-003,5555555555555,20,5,EA,3000,2026-06-30,,2025-09-24",
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `inventory_template_${
      new Date().toISOString().split("T")[0]
    }.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, []);

  // ============================================
  // CSV 파싱 함수 (개선)
  // ============================================
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

    if (lines.length - 1 > MAX_ROWS) {
      throw new Error(`최대 ${MAX_ROWS}행까지만 업로드 가능합니다`);
    }

    return lines.slice(1).map((line, index) => {
      const values = line.split(",").map((v) => v.trim());
      const row: ParsedRow = {
        name: "",
        _errors: [],
        _warnings: [],
        _rowIndex: index + 2,
      };

      headers.forEach((header, i) => {
        const value = values[i] || "";
        switch (header) {
          case "name":
            row.name = value;
            if (!value) row._errors?.push("상품명은 필수입니다");
            else if (value.length > 100)
              row._warnings?.push("상품명이 너무 깁니다 (100자 초과)");
            break;
          case "sku":
            row.sku = value || undefined;
            if (value && value.length > 50)
              row._warnings?.push("SKU가 너무 깁니다");
            break;
          case "barcode":
            row.barcode = value || undefined;
            if (value && !/^\d+$/.test(value))
              row._warnings?.push("바코드는 숫자만 입력해야 합니다");
            break;
          case "qty":
            row.qty = value ? parseInt(value, 10) : 0;
            if (value && isNaN(row.qty))
              row._errors?.push("수량은 숫자여야 합니다");
            else if (row.qty < 0)
              row._errors?.push("수량은 0 이상이어야 합니다");
            break;
          case "minQty":
            row.minQty = value ? parseInt(value, 10) : 0;
            if (value && isNaN(row.minQty))
              row._errors?.push("최소재고는 숫자여야 합니다");
            else if (row.minQty < 0)
              row._errors?.push("최소재고는 0 이상이어야 합니다");
            break;
          case "price":
            row.price = value ? parseFloat(value) : undefined;
            if (value && isNaN(row.price!))
              row._errors?.push("가격은 숫자여야 합니다");
            else if (row.price && row.price < 0)
              row._errors?.push("가격은 0 이상이어야 합니다");
            break;
          case "unit":
            row.unit = value || "EA";
            break;
          case "expiryDate":
            row.expiryDate = value || undefined;
            if (value && !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
              row._errors?.push("유통기한은 YYYY-MM-DD 형식이어야 합니다");
            } else if (value) {
              const expiryDate = new Date(value);
              const today = new Date();
              if (expiryDate < today)
                row._warnings?.push("유통기한이 이미 지났습니다");
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

  // ============================================
  // 중복 체크
  // ============================================
  const checkDuplicates = useCallback((data: ParsedRow[]) => {
    const skuMap = new Map<string, number[]>();

    data.forEach((row, index) => {
      if (row.sku) {
        if (!skuMap.has(row.sku)) {
          skuMap.set(row.sku, []);
        }
        skuMap.get(row.sku)!.push(index);
      }
    });

    const duplicates = Array.from(skuMap.entries()).filter(
      ([_, indices]) => indices.length > 1
    );

    // 중복된 행에 경고 추가
    duplicates.forEach(([sku, indices]) => {
      indices.forEach((idx) => {
        if (!data[idx]._warnings) data[idx]._warnings = [];
        data[idx]._warnings!.push(`SKU '${sku}'가 중복됩니다`);
      });
    });

    return duplicates.length;
  }, []);

  // ============================================
  // 파일 업로드 처리 (개선)
  // ============================================
  const handleFileUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      // 파일 크기 검증
      if (file.size > MAX_FILE_SIZE) {
        setUploadState({
          file: null,
          parsing: false,
          error: `파일 크기는 ${formatFileSize(
            MAX_FILE_SIZE
          )}를 초과할 수 없습니다`,
        });
        return;
      }

      // 파일 형식 검증
      if (!file.name.endsWith(".csv")) {
        setUploadState({
          file: null,
          parsing: false,
          error: "CSV 파일만 업로드 가능합니다",
        });
        return;
      }

      setUploadState({ file, parsing: true, error: null });
      setStartTime(Date.now());

      try {
        const text = await file.text();
        const parsedRows = parseCSV(text);

        // 중복 체크
        checkDuplicates(parsedRows);

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
    [parseCSV, checkDuplicates]
  );

  // ============================================
  // 일괄 적용 (청크 단위 처리)
  // ============================================
  const handleBulkApply = useCallback(async () => {
    const validRows = rows.filter(
      (row) => !row._errors || row._errors.length === 0
    );

    if (validRows.length === 0) return;

    setImporting(true);
    abortControllerRef.current = new AbortController();
    setProgress({
      current: 0,
      total: validRows.length,
      percentage: 0,
      status: "processing",
    });

    const CHUNK_SIZE = 50; // 50개씩 처리
    const chunks: ParsedRow[][] = [];

    for (let i = 0; i < validRows.length; i += CHUNK_SIZE) {
      chunks.push(validRows.slice(i, i + CHUNK_SIZE));
    }

    try {
      let processedCount = 0;

      for (const chunk of chunks) {
        // 취소 확인
        if (abortControllerRef.current?.signal.aborted) {
          throw new Error("사용자가 작업을 취소했습니다");
        }

        // 청크 처리
        for (const row of chunk) {
          const item = addItem({
            name: row.name,
            sku: row.sku,
            barcode: row.barcode,
            minStock: row.minQty || 0,
            defaultPrice: row.price,
            stock: 0,
            expiryDate: row.expiryDate,
            batchNumber: row.batchNumber,
            receivedDate: row.receivedDate,
          });

          if (row.qty && row.qty > 0) {
            await createMovement({
              type: "IN",
              itemId: item.id,
              qty: row.qty,
              reason: "일괄 업로드",
            });
          }

          processedCount++;
          setProgress({
            current: processedCount,
            total: validRows.length,
            percentage: Math.round((processedCount / validRows.length) * 100),
            status: "processing",
          });
        }

        // UI 업데이트를 위한 작은 딜레이
        await new Promise((resolve) => setTimeout(resolve, 0));
      }

      setProgress((prev) => ({ ...prev, status: "completed" }));

      // 성공 후 잠시 대기 후 리다이렉트
      setTimeout(() => {
        navigate("/inventory", { replace: true });
      }, 1000);
    } catch (error) {
      console.error("일괄 적용 실패:", error);
      setProgress((prev) => ({ ...prev, status: "error" }));
      setUploadState((prev) => ({
        ...prev,
        error:
          error instanceof Error
            ? error.message
            : "일괄 적용 중 오류가 발생했습니다",
      }));
    } finally {
      setImporting(false);
      abortControllerRef.current = null;
    }
  }, [rows, addItem, createMovement, navigate]);

  // ============================================
  // 작업 취소
  // ============================================
  const handleCancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  // ============================================
  // 행 제거
  // ============================================
  const handleRemoveRow = useCallback((index: number) => {
    setRows((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // ============================================
  // 초기화
  // ============================================
  const handleReset = useCallback(() => {
    setRows([]);
    setStep(1);
    setUploadState({ file: null, parsing: false, error: null });
    setSearchTerm("");
    setFilterType("all");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  // ============================================
  // 통계 계산 (메모이제이션)
  // ============================================
  const stats = useMemo(() => {
    const total = rows.length;
    const valid = rows.filter(
      (row) => !row._errors || row._errors.length === 0
    ).length;
    const errors = rows.filter(
      (row) => row._errors && row._errors.length > 0
    ).length;
    const warnings = rows.filter(
      (row) =>
        row._warnings &&
        row._warnings.length > 0 &&
        (!row._errors || row._errors.length === 0)
    ).length;

    return { total, valid, errors, warnings };
  }, [rows]);

  // ============================================
  // 필터링 및 검색 (메모이제이션)
  // ============================================
  const filteredRows = useMemo(() => {
    let filtered = rows;

    // 필터 적용
    if (filterType === "valid") {
      filtered = filtered.filter(
        (row) => !row._errors || row._errors.length === 0
      );
    } else if (filterType === "errors") {
      filtered = filtered.filter(
        (row) => row._errors && row._errors.length > 0
      );
    } else if (filterType === "warnings") {
      filtered = filtered.filter(
        (row) =>
          row._warnings &&
          row._warnings.length > 0 &&
          (!row._errors || row._errors.length === 0)
      );
    }

    // 검색 적용
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (row) =>
          row.name.toLowerCase().includes(term) ||
          row.sku?.toLowerCase().includes(term) ||
          row.barcode?.toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [rows, filterType, searchTerm]);

  // ============================================
  // 다음 단계 가능 여부
  // ============================================
  const canNext = useMemo(() => {
    if (step === 1) return rows.length > 0;
    if (step === 2) return rows.length > 0;
    return stats.valid > 0;
  }, [step, rows.length, stats.valid]);

  // ============================================
  // Cleanup
  // ============================================
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // ============================================
  // 렌더링
  // ============================================
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-50 p-4 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl shadow-lg shadow-emerald-500/30">
                <FileSpreadsheet className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-1">
                  일괄 업로드
                </h1>
                <p className="text-gray-600">
                  CSV 파일로 여러 상품을 한 번에 등록하세요
                </p>
              </div>
            </div>
            <Link
              to="/inventory"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-gray-700 bg-white hover:bg-gray-50 rounded-xl border border-gray-200 shadow-sm transition-all hover:shadow"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="font-medium">인벤토리로</span>
            </Link>
          </div>

          {/* 파일 정보 */}
          {uploadState.file && (
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileCheck className="w-5 h-5 text-emerald-600" />
                  <div>
                    <div className="font-medium text-gray-900">
                      {uploadState.file.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatFileSize(uploadState.file.size)} • {stats.total}행
                      {startTime > 0 && (
                        <>
                          {" "}
                          • 처리 시간: {formatDuration(Date.now() - startTime)}
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleReset}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  title="초기화"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 메인 콘텐츠 */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          {/* 진행 단계 */}
          <div className="bg-gradient-to-r from-gray-50 to-blue-50/30 p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-900">
                업로드 진행 단계
              </h2>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-gray-200">
                <Zap className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-medium text-gray-700">
                  단계 {step}/3
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Step 1: 파일 선택 */}
              <div
                className={`relative p-5 rounded-xl border-2 transition-all duration-300 ${
                  step === 1
                    ? "border-emerald-400 bg-gradient-to-br from-emerald-50 to-green-50 shadow-lg shadow-emerald-100"
                    : step > 1
                    ? "border-green-300 bg-gradient-to-br from-green-50 to-emerald-50"
                    : "border-gray-200 bg-gray-50 opacity-60"
                }`}
              >
                {step > 1 && (
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  </div>
                )}
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-base font-bold shadow-sm ${
                      step > 1
                        ? "bg-green-500 text-white"
                        : step === 1
                        ? "bg-emerald-500 text-white"
                        : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    {step > 1 ? "✓" : "1"}
                  </div>
                  <h3 className="font-semibold text-gray-900">파일 선택</h3>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  CSV 파일을 업로드하세요
                </p>
                {step === 1 && (
                  <div className="space-y-2">
                    <button
                      onClick={downloadTemplate}
                      className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-emerald-700 bg-emerald-100 rounded-lg hover:bg-emerald-200 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      템플릿 다운로드
                    </button>
                    <label className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium bg-white border-2 border-gray-300 border-dashed rounded-lg cursor-pointer hover:border-emerald-400 hover:bg-emerald-50 transition-colors">
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
              </div>

              {/* Step 2: 데이터 검증 */}
              <div
                className={`relative p-5 rounded-xl border-2 transition-all duration-300 ${
                  step === 2
                    ? "border-emerald-400 bg-gradient-to-br from-emerald-50 to-green-50 shadow-lg shadow-emerald-100"
                    : step > 2
                    ? "border-green-300 bg-gradient-to-br from-green-50 to-emerald-50"
                    : "border-gray-200 bg-gray-50 opacity-60"
                }`}
              >
                {step > 2 && (
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  </div>
                )}
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-base font-bold shadow-sm ${
                      step > 2
                        ? "bg-green-500 text-white"
                        : step === 2
                        ? "bg-emerald-500 text-white"
                        : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    {step > 2 ? "✓" : "2"}
                  </div>
                  <h3 className="font-semibold text-gray-900">데이터 검증</h3>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  데이터 형식을 확인하세요
                </p>
                {step >= 2 && (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      <span className="text-gray-700">총 {stats.total}행</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <span className="text-gray-700">
                        유효 {stats.valid}행
                      </span>
                    </div>
                    {stats.errors > 0 && (
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                        <span className="text-gray-700">
                          오류 {stats.errors}행
                        </span>
                      </div>
                    )}
                    {stats.warnings > 0 && (
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                        <span className="text-gray-700">
                          경고 {stats.warnings}행
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Step 3: 적용 */}
              <div
                className={`relative p-5 rounded-xl border-2 transition-all duration-300 ${
                  step === 3
                    ? "border-emerald-400 bg-gradient-to-br from-emerald-50 to-green-50 shadow-lg shadow-emerald-100"
                    : "border-gray-200 bg-gray-50 opacity-60"
                }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-base font-bold shadow-sm ${
                      step === 3
                        ? "bg-emerald-500 text-white"
                        : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    3
                  </div>
                  <h3 className="font-semibold text-gray-900">적용</h3>
                </div>
                <p className="text-sm text-gray-600 mb-3">상품을 등록합니다</p>
                {step === 3 && stats.valid > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-emerald-600 text-sm font-medium">
                      <TrendingUp className="w-4 h-4" />
                      {stats.valid}건 적용 준비됨
                    </div>
                    {importing && (
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-xs text-gray-600 mb-1.5">
                          <span>진행률</span>
                          <span className="font-medium">
                            {progress.percentage}%
                          </span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-500 to-green-500 transition-all duration-300"
                            style={{ width: `${progress.percentage}%` }}
                          ></div>
                        </div>
                        <div className="mt-1.5 text-xs text-gray-500 text-center">
                          {progress.current} / {progress.total}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 에러 표시 */}
          {uploadState.error && (
            <div className="p-6 border-b border-gray-200">
              <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-red-900 mb-1">
                      파일 업로드 오류
                    </h4>
                    <p className="text-sm text-red-700">{uploadState.error}</p>
                  </div>
                  <button
                    onClick={() =>
                      setUploadState((prev) => ({ ...prev, error: null }))
                    }
                    className="text-red-600 hover:text-red-800 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 파싱 중 로딩 */}
          {uploadState.parsing && (
            <div className="p-6 border-b border-gray-200">
              <div className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-blue-900 font-medium">
                    파일을 분석하는 중...
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 검색 및 필터 */}
          {step >= 2 && rows.length > 0 && (
            <div className="p-6 border-b border-gray-200 bg-gray-50">
              <div className="flex flex-col sm:flex-row gap-3">
                {/* 검색 */}
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="상품명, SKU, 바코드로 검색..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                  />
                </div>

                {/* 필터 */}
                <div className="flex items-center gap-2">
                  <Filter className="w-5 h-5 text-gray-400" />
                  <select
                    value={filterType}
                    onChange={(e) =>
                      setFilterType(e.target.value as FilterType)
                    }
                    className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white"
                  >
                    <option value="all">전체 ({stats.total})</option>
                    <option value="valid">정상 ({stats.valid})</option>
                    <option value="errors">오류 ({stats.errors})</option>
                    <option value="warnings">경고 ({stats.warnings})</option>
                  </select>
                </div>
              </div>

              {/* 통계 카드 */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                <div className="bg-white p-3 rounded-lg border border-gray-200">
                  <div className="text-xs text-gray-500 mb-1">전체</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {stats.total}
                  </div>
                </div>
                <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                  <div className="text-xs text-green-700 mb-1">정상</div>
                  <div className="text-2xl font-bold text-green-700">
                    {stats.valid}
                  </div>
                </div>
                <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                  <div className="text-xs text-red-700 mb-1">오류</div>
                  <div className="text-2xl font-bold text-red-700">
                    {stats.errors}
                  </div>
                </div>
                <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
                  <div className="text-xs text-amber-700 mb-1">경고</div>
                  <div className="text-2xl font-bold text-amber-700">
                    {stats.warnings}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 데이터 테이블 */}
          {step >= 2 && filteredRows.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      행
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      상품명
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      SKU
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      수량
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      최소재고
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      단위
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      가격
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      상태
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      작업
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRows.slice(0, 20).map((row, index) => (
                    <TableRow
                      key={index}
                      row={row}
                      index={index}
                      onRemove={handleRemoveRow}
                    />
                  ))}
                </tbody>
              </table>
              {filteredRows.length > 20 && (
                <div className="bg-gray-50 px-4 py-3 text-sm text-gray-600 text-center border-t border-gray-200">
                  ... 외 {filteredRows.length - 20}개 행 더
                </div>
              )}
            </div>
          )}

          {/* 필터링 결과가 없을 때 */}
          {step >= 2 && rows.length > 0 && filteredRows.length === 0 && (
            <div className="p-12 text-center">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">검색 결과가 없습니다</p>
            </div>
          )}

          {/* 오류 상세 */}
          {step >= 2 && stats.errors > 0 && (
            <div className="p-6 border-t border-gray-200 bg-red-50">
              <h4 className="text-md font-semibold text-red-900 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                오류 상세 ({stats.errors}건)
              </h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {rows
                  .filter((row) => row._errors && row._errors.length > 0)
                  .slice(0, 10)
                  .map((row, index) => (
                    <div
                      key={index}
                      className="p-3 bg-white border-l-4 border-red-500 rounded shadow-sm"
                    >
                      <div className="font-medium text-red-900 text-sm mb-1">
                        행 {row._rowIndex}: {row.name || "(이름 없음)"}
                      </div>
                      <ul className="text-sm text-red-700 space-y-0.5">
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
          <div className="p-6 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 rounded-xl border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  onClick={() => {
                    if (step > 1) {
                      setStep((s) => (s - 1) as 1 | 2 | 3);
                    }
                  }}
                  disabled={step === 1 || importing}
                >
                  이전
                </button>
                {step === 1 && rows.length === 0 && (
                  <button
                    onClick={downloadTemplate}
                    className="px-5 py-2.5 text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl border border-emerald-200 transition-all"
                  >
                    <Download className="w-4 h-4 inline mr-2" />
                    템플릿 다운로드
                  </button>
                )}
              </div>
              <div className="flex items-center gap-3">
                {importing && (
                  <button
                    onClick={handleCancel}
                    className="px-5 py-2.5 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-xl border border-red-200 transition-all"
                  >
                    취소
                  </button>
                )}
                {step < 3 && (
                  <button
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 text-white font-medium hover:from-emerald-700 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/30 transition-all"
                    onClick={() => setStep((s) => (s + 1) as 1 | 2 | 3)}
                    disabled={!canNext}
                  >
                    다음
                  </button>
                )}
                {step === 3 && (
                  <button
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 text-white font-medium hover:from-emerald-700 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/30 transition-all"
                    disabled={stats.valid === 0 || importing}
                    onClick={handleBulkApply}
                  >
                    {importing ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        적용 중...
                      </>
                    ) : (
                      <>
                        <Package className="w-5 h-5" />
                        {stats.valid}건 상품 등록
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 도움말 */}
        <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-blue-100 rounded-xl">
              <Info className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 mb-3 text-lg">
                업로드 가이드
              </h3>
              <div className="grid sm:grid-cols-2 gap-3 text-sm text-blue-800">
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2"></div>
                  <div>
                    <strong>템플릿 다운로드:</strong> 올바른 형식을 확인하기
                    위해 템플릿을 다운로드하세요
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2"></div>
                  <div>
                    <strong>필수 필드:</strong> name(상품명)은 반드시 입력해야
                    합니다
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2"></div>
                  <div>
                    <strong>날짜 형식:</strong> 날짜는 YYYY-MM-DD 형식으로
                    입력하세요 (예: 2025-12-31)
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2"></div>
                  <div>
                    <strong>숫자 필드:</strong> qty, minQty, price는 숫자만 입력
                    가능합니다
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2"></div>
                  <div>
                    <strong>파일 형식:</strong> CSV 파일만 지원합니다 (UTF-8
                    인코딩 권장)
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2"></div>
                  <div>
                    <strong>파일 크기:</strong> 최대 10MB, 10,000행까지 지원
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
