import type { ParsedRow } from "../types";
import { TEMPLATE_DATA } from "../constants";
import { rowsToCSV } from "./csv-parser";
import { generateFilename } from "./formatters";

/**
 * Download CSV template
 */
export const downloadTemplate = (): void => {
  const blob = new Blob(["\uFEFF" + TEMPLATE_DATA], {
    type: "text/csv;charset=utf-8",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = generateFilename("inventory_template", ".csv");

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Export rows to CSV
 */
export const exportToCSV = (
  rows: ParsedRow[],
  filename = "inventory_export"
): void => {
  const csvContent = rowsToCSV(rows);

  const blob = new Blob(["\uFEFF" + csvContent], {
    type: "text/csv;charset=utf-8",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = generateFilename(filename, ".csv");

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Export inventory items from localStorage (기준: inventory-items 키, Zustand persist 구조)
 */
export const exportLocalStorageToCSV = (): void => {
  try {
    const itemsData = localStorage.getItem("inventory-items");
    if (!itemsData) {
      alert("백업할 데이터가 없습니다.\n상품을 먼저 등록해주세요.");
      return;
    }

    const parsed = JSON.parse(itemsData);

    // 객체 또는 배열 모두 지원
    let items: any[] = [];
    const rawItems = parsed?.state?.items;
    if (Array.isArray(rawItems)) {
      items = rawItems;
    } else if (rawItems && typeof rawItems === "object") {
      items = Object.values(rawItems);
    }

    if (!items.length) {
      alert("상품목록이 비어있습니다.\n상품을 먼저 등록해주세요.");
      return;
    }

    const headers = [
      "id",
      "name",
      "sku",
      "barcode",
      "stock",
      "minStock",
      "unit",
      "defaultPrice",
      "expiryDate",
      "batchNumber",
      "categoryId",
      "receivedDate",
    ];

    const csvContent = [
      headers.join(","),
      ...items.map((item: any) =>
        [
          item.id || "",
          item.name || "",
          item.sku || "",
          item.barcode || "",
          item.stock ?? 0,
          item.minStock ?? 0,
          item.unit || "EA",
          item.defaultPrice ?? "",
          item.expiryDate || "",
          item.batchNumber || "",
          item.categoryId || "",
          item.receivedDate || "",
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `inventory_backup_${
      new Date().toISOString().split("T")[0]
    }.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    alert(`백업 완료!\n\n${items.length}개의 상품을 CSV로 내보냈습니다.`);
  } catch (error) {
    console.error("백업 실패:", error);
    alert(
      "데이터 백업 중 오류가 발생했습니다. 개발자 도구 Console을 확인해주세요."
    );
  }
};
