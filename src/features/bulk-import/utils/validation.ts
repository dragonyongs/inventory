import type { ParsedRow, DuplicateInfo } from "../types";
import { MAX_FILE_SIZE, ALLOWED_FILE_TYPES } from "../constants";
import { formatFileSize, getFileExtension } from "./formatters";

/**
 * Check for duplicate SKUs across rows
 */
export const checkDuplicates = (data: ParsedRow[]): DuplicateInfo[] => {
  const skuMap = new Map<string, number[]>();

  data.forEach((row, index) => {
    if (row.sku) {
      if (!skuMap.has(row.sku)) {
        skuMap.set(row.sku, []);
      }
      skuMap.get(row.sku)!.push(index);
    }
  });

  const duplicates = Array.from(skuMap.entries())
    .filter(([_, indices]) => indices.length > 1)
    .map(([sku, indices]) => ({
      field: "sku",
      value: sku,
      indices,
    }));

  // Add warnings to duplicate rows
  duplicates.forEach(({ value, indices }) => {
    indices.forEach((idx) => {
      if (!data[idx]._warnings) data[idx]._warnings = [];
      data[idx]._warnings!.push(`SKU '${value}'가 중복됩니다`);
    });
  });

  return duplicates;
};

/**
 * Validate file size
 */
export const validateFileSize = (
  size: number
): { valid: boolean; error?: string } => {
  if (size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `파일 크기는 ${formatFileSize(
        MAX_FILE_SIZE
      )}를 초과할 수 없습니다`,
    };
  }
  return { valid: true };
};

/**
 * Validate file type
 */
export const validateFileType = (
  filename: string
): { valid: boolean; error?: string } => {
  const extension = getFileExtension(filename);

  if (!ALLOWED_FILE_TYPES.includes(extension as any)) {
    return {
      valid: false,
      error: `${ALLOWED_FILE_TYPES.join(", ")} 파일만 업로드 가능합니다`,
    };
  }
  return { valid: true };
};

/**
 * Get row status badge color
 */
export const getRowStatusColor = (
  row: ParsedRow
): "error" | "warning" | "success" => {
  if (row._errors && row._errors.length > 0) return "error";
  if (row._warnings && row._warnings.length > 0) return "warning";
  return "success";
};

/**
 * Check if row is valid (no errors)
 */
export const isRowValid = (row: ParsedRow): boolean => {
  return !row._errors || row._errors.length === 0;
};

/**
 * Get validation summary
 */
export const getValidationSummary = (rows: ParsedRow[]) => {
  const total = rows.length;
  const valid = rows.filter(isRowValid).length;
  const errors = rows.filter(
    (row) => row._errors && row._errors.length > 0
  ).length;
  const warnings = rows.filter(
    (row) => row._warnings && row._warnings.length > 0 && isRowValid(row)
  ).length;

  return {
    total,
    valid,
    errors,
    warnings,
    hasErrors: errors > 0,
    isAllValid: errors === 0,
  };
};
