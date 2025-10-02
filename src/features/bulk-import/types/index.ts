// Core domain types
export type ParsedRow = {
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

export type FileUploadState = {
  file: File | null;
  parsing: boolean;
  error: string | null;
};

export type ImportProgress = {
  current: number;
  total: number;
  percentage: number;
  status: "idle" | "processing" | "completed" | "error";
};

export type FilterType = "all" | "valid" | "errors" | "warnings";

export type ImportStats = {
  total: number;
  valid: number;
  errors: number;
  warnings: number;
};

export type SortConfig = {
  key: keyof ParsedRow | null;
  direction: "asc" | "desc";
};

export type DuplicateInfo = {
  field: string;
  value: string;
  indices: number[];
};
