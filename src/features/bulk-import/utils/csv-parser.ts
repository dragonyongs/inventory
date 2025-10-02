import type { ParsedRow } from "../types";
import {
  REQUIRED_HEADERS,
  MAX_ROWS,
  VALIDATION_RULES,
  DEFAULT_UNIT,
  DEFAULT_DATE,
} from "../constants";

/**
 * Parse CSV text to structured rows
 */
export const parseCSV = (text: string): ParsedRow[] => {
  const lines = text.trim().split("\n");

  if (lines.length < 2) {
    throw new Error("CSV 파일에 데이터가 없습니다");
  }

  // Parse headers
  const headers = lines[0].split(",").map((h) => h.trim());

  // Validate required headers
  const missingHeaders = REQUIRED_HEADERS.filter((h) => !headers.includes(h));
  if (missingHeaders.length > 0) {
    throw new Error(`필수 헤더가 누락되었습니다: ${missingHeaders.join(", ")}`);
  }

  // Check max rows
  if (lines.length - 1 > MAX_ROWS) {
    throw new Error(
      `최대 ${MAX_ROWS.toLocaleString()}행까지만 업로드 가능합니다`
    );
  }

  // Parse data rows
  return lines.slice(1).map((line, index) => {
    const values = line.split(",").map((v) => v.trim());
    const row: ParsedRow = {
      name: "",
      _errors: [],
      _warnings: [],
      _rowIndex: index + 2, // +2 for header and 1-based index
    };

    headers.forEach((header, i) => {
      const value = values[i] || "";
      parseField(row, header, value);
    });

    return row;
  });
};

/**
 * Parse individual field with validation
 */
const parseField = (row: ParsedRow, header: string, value: string): void => {
  switch (header) {
    case "name":
      row.name = value;
      if (!value) {
        row._errors?.push("상품명은 필수입니다");
      } else if (value.length > VALIDATION_RULES.NAME_MAX_LENGTH) {
        row._warnings?.push(
          `상품명이 너무 깁니다 (${VALIDATION_RULES.NAME_MAX_LENGTH}자 초과)`
        );
      }
      break;

    case "sku":
      row.sku = value || undefined;
      if (value && value.length > VALIDATION_RULES.SKU_MAX_LENGTH) {
        row._warnings?.push("SKU가 너무 깁니다");
      }
      break;

    case "barcode":
      row.barcode = value || undefined;
      if (value && !VALIDATION_RULES.BARCODE_PATTERN.test(value)) {
        row._warnings?.push("바코드는 숫자만 입력해야 합니다");
      }
      break;

    case "qty":
      row.qty = value ? parseInt(value, 10) : 0;
      if (value && isNaN(row.qty)) {
        row._errors?.push("수량은 숫자여야 합니다");
      } else if (row.qty < VALIDATION_RULES.MIN_QTY) {
        row._errors?.push(
          `수량은 ${VALIDATION_RULES.MIN_QTY} 이상이어야 합니다`
        );
      }
      break;

    case "minQty":
      row.minQty = value ? parseInt(value, 10) : 0;
      if (value && isNaN(row.minQty)) {
        row._errors?.push("최소재고는 숫자여야 합니다");
      } else if (row.minQty < VALIDATION_RULES.MIN_QTY) {
        row._errors?.push(
          `최소재고는 ${VALIDATION_RULES.MIN_QTY} 이상이어야 합니다`
        );
      }
      break;

    case "price":
      row.price = value ? parseFloat(value) : undefined;
      if (value && isNaN(row.price!)) {
        row._errors?.push("가격은 숫자여야 합니다");
      } else if (
        row.price !== undefined &&
        row.price < VALIDATION_RULES.MIN_PRICE
      ) {
        row._errors?.push(
          `가격은 ${VALIDATION_RULES.MIN_PRICE} 이상이어야 합니다`
        );
      }
      break;

    case "unit":
      row.unit = value || DEFAULT_UNIT;
      break;

    case "expiryDate":
      row.expiryDate = value || undefined;
      if (value && !VALIDATION_RULES.DATE_PATTERN.test(value)) {
        row._errors?.push("유통기한은 YYYY-MM-DD 형식이어야 합니다");
      } else if (value) {
        const expiryDate = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (expiryDate < today) {
          row._warnings?.push("유통기한이 이미 지났습니다");
        }
      }
      break;

    case "batchNumber":
      row.batchNumber = value || undefined;
      break;

    case "receivedDate":
      row.receivedDate = value || DEFAULT_DATE();
      if (value && !VALIDATION_RULES.DATE_PATTERN.test(value)) {
        row._errors?.push("입고일은 YYYY-MM-DD 형식이어야 합니다");
      }
      break;

    default:
      // Ignore unknown headers
      break;
  }
};

/**
 * Convert rows back to CSV format
 */
export const rowsToCSV = (rows: ParsedRow[]): string => {
  const headers = [
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
  ];

  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((h) => {
          const value = row[h as keyof ParsedRow];
          return value !== undefined && value !== null ? String(value) : "";
        })
        .join(",")
    ),
  ].join("\n");

  return csvContent;
};
