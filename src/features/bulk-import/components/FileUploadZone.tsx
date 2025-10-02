import React, { useCallback } from "react";
import { Upload, FileSpreadsheet, AlertCircle } from "lucide-react";
import type { FileUploadState } from "../types";
import { formatFileSize } from "../utils/formatters";

type FileUploadZoneProps = {
  uploadState: FileUploadState;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
};

export const FileUploadZone: React.FC<FileUploadZoneProps> = ({
  uploadState,
  fileInputRef,
  onFileChange,
  disabled = false,
}) => {
  const { file, parsing, error } = uploadState;

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (disabled) return;

      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile && fileInputRef.current) {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(droppedFile);
        fileInputRef.current.files = dataTransfer.files;
        fileInputRef.current.dispatchEvent(
          new Event("change", { bubbles: true })
        );
      }
    },
    [disabled, fileInputRef]
  );

  return (
    <div className="w-full">
      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-lg p-8
          transition-colors duration-200
          ${
            error
              ? "border-red-300 bg-red-50"
              : file
              ? "border-green-300 bg-green-50"
              : "border-gray-300 bg-gray-50 hover:border-gray-400"
          }
          ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        `}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={onFileChange}
          disabled={disabled}
          className="hidden"
        />

        <div className="flex flex-col items-center gap-4">
          {/* Icon */}
          <div
            className={`
              w-16 h-16 rounded-full flex items-center justify-center
              ${error ? "bg-red-100" : file ? "bg-green-100" : "bg-gray-200"}
            `}
          >
            {error ? (
              <AlertCircle className="w-8 h-8 text-red-500" />
            ) : file ? (
              <FileSpreadsheet className="w-8 h-8 text-green-600" />
            ) : (
              <Upload className="w-8 h-8 text-gray-500" />
            )}
          </div>

          {/* Text */}
          <div className="text-center">
            {parsing ? (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-900">
                  파일 분석 중...
                </p>
                <div className="flex justify-center">
                  <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
                </div>
              </div>
            ) : error ? (
              <div className="space-y-1">
                <p className="text-sm font-medium text-red-900">업로드 실패</p>
                <p className="text-xs text-red-600">{error}</p>
              </div>
            ) : file ? (
              <div className="space-y-1">
                <p className="text-sm font-medium text-green-900">
                  {file.name}
                </p>
                <p className="text-xs text-green-600">
                  {formatFileSize(file.size)}
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-900">
                  CSV 파일을 드래그하거나 클릭하여 선택
                </p>
                <p className="text-xs text-gray-500">
                  최대 10MB까지 업로드 가능
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
