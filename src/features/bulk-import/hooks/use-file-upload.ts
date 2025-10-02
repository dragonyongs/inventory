import { useState, useCallback, useRef } from "react";
import type { FileUploadState, ParsedRow } from "../types";
import { parseCSV } from "../utils/csv-parser";
import {
  checkDuplicates,
  validateFileSize,
  validateFileType,
} from "../utils/validation";

export const useFileUpload = () => {
  const [uploadState, setUploadState] = useState<FileUploadState>({
    file: null,
    parsing: false,
    error: null,
  });
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [startTime, setStartTime] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return false;

      // Validate file size
      const sizeValidation = validateFileSize(file.size);
      if (!sizeValidation.valid) {
        setUploadState({
          file: null,
          parsing: false,
          error: sizeValidation.error!,
        });
        return false;
      }

      // Validate file type
      const typeValidation = validateFileType(file.name);
      if (!typeValidation.valid) {
        setUploadState({
          file: null,
          parsing: false,
          error: typeValidation.error!,
        });
        return false;
      }

      setUploadState({ file, parsing: true, error: null });
      setStartTime(Date.now());

      try {
        const text = await file.text();
        const parsedRows = parseCSV(text);

        // Check for duplicates
        checkDuplicates(parsedRows);

        setRows(parsedRows);
        setUploadState({ file, parsing: false, error: null });
        return true;
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
        return false;
      }
    },
    []
  );

  const resetUpload = useCallback(() => {
    setRows([]);
    setUploadState({ file: null, parsing: false, error: null });
    setStartTime(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const removeRow = useCallback((index: number) => {
    setRows((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const updateRow = useCallback((index: number, updatedRow: ParsedRow) => {
    setRows((prev) => prev.map((row, i) => (i === index ? updatedRow : row)));
  }, []);

  return {
    uploadState,
    rows,
    startTime,
    fileInputRef,
    handleFileUpload,
    resetUpload,
    removeRow,
    updateRow,
  };
};
