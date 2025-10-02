import React, { memo } from "react";
import { Trash2, ArrowUpDown } from "lucide-react";
import type { ParsedRow, SortConfig } from "../types";
import { formatPrice, formatDate } from "../utils/formatters";
import { getRowStatusColor } from "../utils/validation";
import { ErrorList } from "./ErrorList";

type DataTableProps = {
  rows: ParsedRow[];
  sortConfig: SortConfig;
  onSort: (key: keyof ParsedRow) => void;
  onRemoveRow: (index: number) => void;
};

// Memoized table row for performance
const TableRow = memo<{
  row: ParsedRow;
  index: number;
  onRemove: (index: number) => void;
}>(({ row, index, onRemove }) => {
  const statusColor = getRowStatusColor(row);
  const hasIssues =
    (row._errors?.length ?? 0) > 0 || (row._warnings?.length ?? 0) > 0;

  return (
    <tr
      className={`
        border-b border-gray-100 hover:bg-gray-50 transition-colors
        ${statusColor === "error" ? "bg-red-50" : ""}
        ${statusColor === "warning" ? "bg-yellow-50" : ""}
      `}
    >
      <td className="px-4 py-3 text-xs text-gray-500 tabular-nums">
        {row._rowIndex}
      </td>
      <td className="px-4 py-3">
        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-900">{row.name}</p>
          {hasIssues && (
            <ErrorList errors={row._errors} warnings={row._warnings} />
          )}
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-gray-600">{row.sku || "-"}</td>
      <td className="px-4 py-3 text-sm text-gray-600 tabular-nums">
        {row.barcode || "-"}
      </td>
      <td className="px-4 py-3 text-sm text-gray-900 font-medium tabular-nums">
        {row.qty ?? 0}
      </td>
      <td className="px-4 py-3 text-sm text-gray-600 tabular-nums">
        {row.minQty ?? 0}
      </td>
      <td className="px-4 py-3 text-sm text-gray-600">{row.unit || "EA"}</td>
      <td className="px-4 py-3 text-sm text-gray-900 font-medium tabular-nums">
        {formatPrice(row.price)}
      </td>
      <td className="px-4 py-3 text-sm text-gray-600">
        {formatDate(row.expiryDate)}
      </td>
      <td className="px-4 py-3">
        <button
          onClick={() => onRemove(index)}
          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
          title="행 삭제"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </td>
    </tr>
  );
});

TableRow.displayName = "TableRow";

// Sortable header
const SortableHeader: React.FC<{
  label: string;
  sortKey: keyof ParsedRow;
  currentSort: SortConfig;
  onSort: (key: keyof ParsedRow) => void;
}> = ({ label, sortKey, currentSort, onSort }) => {
  const isActive = currentSort.key === sortKey;

  return (
    <th className="px-4 py-3 text-left">
      <button
        onClick={() => onSort(sortKey)}
        className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 hover:text-gray-900 transition-colors"
      >
        {label}
        <ArrowUpDown
          className={`w-3.5 h-3.5 ${
            isActive ? "text-gray-900" : "text-gray-400"
          }`}
        />
      </button>
    </th>
  );
};

export const DataTable: React.FC<DataTableProps> = ({
  rows,
  sortConfig,
  onSort,
  onRemoveRow,
}) => {
  if (rows.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-sm">표시할 데이터가 없습니다</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border border-gray-200 rounded-lg">
      <table className="w-full bg-white">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">
              행
            </th>
            <SortableHeader
              label="상품명"
              sortKey="name"
              currentSort={sortConfig}
              onSort={onSort}
            />
            <SortableHeader
              label="SKU"
              sortKey="sku"
              currentSort={sortConfig}
              onSort={onSort}
            />
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">
              바코드
            </th>
            <SortableHeader
              label="수량"
              sortKey="qty"
              currentSort={sortConfig}
              onSort={onSort}
            />
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">
              최소재고
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">
              단위
            </th>
            <SortableHeader
              label="가격"
              sortKey="price"
              currentSort={sortConfig}
              onSort={onSort}
            />
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">
              유통기한
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">
              작업
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <TableRow
              key={`${row._rowIndex}-${index}`}
              row={row}
              index={index}
              onRemove={onRemoveRow}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};
