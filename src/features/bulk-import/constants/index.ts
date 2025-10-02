// File upload constraints
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_ROWS = 10000;
export const CHUNK_SIZE = 50;
export const ALLOWED_FILE_TYPES = [".csv"] as const;

// CSV configuration
export const CSV_HEADERS = [
  "name",
  "sku",
  "barcode",
  "qty",
  "minQty",
  "unit",
  "price",
  "expiryDate",
  "batchNumber",
  "receivedDate",
] as const;

export const REQUIRED_HEADERS = ["name"] as const;

// Validation constraints
export const VALIDATION_RULES = {
  NAME_MAX_LENGTH: 100,
  SKU_MAX_LENGTH: 50,
  BARCODE_PATTERN: /^\d+$/,
  DATE_PATTERN: /^\d{4}-\d{2}-\d{2}$/,
  MIN_QTY: 0,
  MIN_PRICE: 0,
} as const;

// Template data
export const TEMPLATE_DATA = [
  CSV_HEADERS.join(","),
  "프리미엄 사과,FRUIT-001,1234567890123,50,10,EA,1000,2025-12-31,LOT-001,2025-09-24",
  "노트북 맥북 프로,LAPTOP-002,9876543210987,5,2,EA,1500000,,BATCH-A,2025-09-24",
  "세제 프리미엄,CLEAN-003,5555555555555,20,5,EA,3000,2026-06-30,,2025-09-24",
].join("\n");

// Filter options
export const FILTER_OPTIONS = [
  { value: "all", label: "전체", icon: "List" },
  { value: "valid", label: "정상", icon: "CheckCircle" },
  { value: "errors", label: "오류", icon: "XCircle" },
  { value: "warnings", label: "경고", icon: "AlertTriangle" },
] as const;

// Default values
export const DEFAULT_UNIT = "EA";
export const DEFAULT_DATE = () => new Date().toISOString().split("T")[0];
