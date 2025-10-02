import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Download,
  Search,
  Filter,
  RefreshCw,
  CheckCircle,
  Database,
} from "lucide-react";
import { useFileUpload } from "./hooks/use-file-upload";
import { useBulkImport } from "./hooks/use-bulk-import";
import { useDataFilter } from "./hooks/use-data-filter";
import {
  downloadTemplate,
  exportToCSV,
  exportLocalStorageToCSV,
} from "./utils/export";
import { formatDuration } from "./utils/formatters";
import { ProgressSteps } from "./components/ProgressSteps";
import { FileUploadZone } from "./components/FileUploadZone";
import { StatsCards } from "./components/StatsCards";
import { DataTable } from "./components/DataTable";
import { FILTER_OPTIONS } from "./constants";
import type { FilterType } from "./types";

export const BulkImportView: React.FC = () => {
  // File upload state
  const {
    uploadState,
    rows,
    startTime,
    fileInputRef,
    handleFileUpload,
    resetUpload,
    removeRow,
  } = useFileUpload();

  // Bulk import state
  const { importing, progress, handleBulkApply, handleCancel } =
    useBulkImport();

  // Filter and search state
  const {
    searchTerm,
    setSearchTerm,
    filterType,
    setFilterType,
    sortConfig,
    handleSort,
    stats,
    filteredRows,
    clearFilters,
    hasActiveFilters,
  } = useDataFilter(rows);

  // UI state
  const [showFilters, setShowFilters] = useState(false);

  // Calculate current step
  const currentStep = useMemo(() => {
    if (importing) return 3;
    if (rows.length > 0) return 2;
    return 1;
  }, [rows.length, importing]);

  // Calculate duration
  const duration = useMemo(() => {
    if (!startTime || uploadState.parsing) return null;
    return Date.now() - startTime;
  }, [startTime, uploadState.parsing]);

  // Handlers
  const handleApply = () => {
    handleBulkApply(rows, (error) => {
      alert(error);
    });
  };

  const handleExportFiltered = () => {
    exportToCSV(filteredRows, "filtered_data");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                to="/inventory"
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  일괄 등록
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  CSV 파일로 여러 상품을 한번에 등록
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={downloadTemplate}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                템플릿 다운로드
              </button>
              <button
                onClick={exportLocalStorageToCSV}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <Database className="w-4 h-4" />
                데이터 백업
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress steps */}
        <ProgressSteps currentStep={currentStep} progress={progress} />

        {/* Step 1: File upload */}
        {currentStep === 1 && (
          <div className="max-w-2xl mx-auto space-y-6">
            <FileUploadZone
              uploadState={uploadState}
              fileInputRef={fileInputRef}
              onFileChange={handleFileUpload}
            />

            {/* Instructions */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                사용 방법
              </h3>
              <ol className="space-y-2 text-sm text-gray-600">
                <li className="flex gap-2">
                  <span className="font-medium text-gray-900">1.</span>
                  <span>위 버튼으로 CSV 템플릿을 다운로드합니다</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-medium text-gray-900">2.</span>
                  <span>템플릿에 상품 정보를 입력합니다</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-medium text-gray-900">3.</span>
                  <span>작성한 CSV 파일을 업로드합니다</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-medium text-gray-900">4.</span>
                  <span>데이터를 확인 후 일괄 등록을 실행합니다</span>
                </li>
              </ol>
            </div>
          </div>
        )}

        {/* Step 2: Data validation and preview */}
        {currentStep === 2 && (
          <div className="space-y-6">
            {/* Stats cards */}
            <StatsCards stats={stats} />

            {/* Parsing info */}
            {duration && (
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>파일 파싱 완료 ({formatDuration(duration)})</span>
                </div>
              </div>
            )}

            {/* Toolbar */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Search */}
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="상품명, SKU, 바코드 검색..."
                    className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                </div>

                {/* Filter toggle */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`
                    px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2
                    ${
                      showFilters || hasActiveFilters
                        ? "bg-gray-900 text-white"
                        : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                    }
                  `}
                >
                  <Filter className="w-4 h-4" />
                  필터
                  {hasActiveFilters && (
                    <span className="w-2 h-2 bg-white rounded-full" />
                  )}
                </button>

                {/* Clear filters */}
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    초기화
                  </button>
                )}

                {/* Export filtered */}
                {filteredRows.length > 0 && (
                  <button
                    onClick={handleExportFiltered}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    내보내기
                  </button>
                )}
              </div>

              {/* Filter options */}
              {showFilters && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex flex-wrap gap-2">
                    {FILTER_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        onClick={() =>
                          setFilterType(option.value as FilterType)
                        }
                        className={`
                          px-4 py-2 text-sm font-medium rounded-lg transition-colors
                          ${
                            filterType === option.value
                              ? "bg-gray-900 text-white"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }
                        `}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Data table */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                <p className="text-sm text-gray-600">
                  총{" "}
                  <span className="font-semibold text-gray-900">
                    {filteredRows.length}
                  </span>
                  개 항목
                </p>
              </div>
              <DataTable
                rows={filteredRows}
                sortConfig={sortConfig}
                onSort={handleSort}
                onRemoveRow={removeRow}
              />
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-between gap-4">
              <button
                onClick={resetUpload}
                disabled={importing}
                className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                다시 선택
              </button>
              <button
                onClick={handleApply}
                disabled={importing || stats.valid === 0}
                className="px-6 py-3 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {importing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    등록 중...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    {stats.valid}개 상품 일괄 등록
                  </>
                )}
              </button>
            </div>

            {/* Warning message */}
            {stats.errors > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-900">
                  <span className="font-semibold">{stats.errors}개</span>의
                  오류가 있는 행은 등록되지 않습니다. 데이터를 수정하거나 해당
                  행을 삭제해주세요.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Importing (handled by progress in ProgressSteps) */}
        {currentStep === 3 && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <RefreshCw className="w-8 h-8 text-gray-900 animate-spin" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                상품 등록 중
              </h3>
              <p className="text-sm text-gray-600">잠시만 기다려주세요...</p>
            </div>

            {progress.status === "processing" && (
              <button
                onClick={handleCancel}
                className="w-full px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  );
};
