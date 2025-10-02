import { useState, useMemo, useCallback } from "react";
import type { ParsedRow, FilterType, ImportStats, SortConfig } from "../types";
import { isRowValid } from "../utils/validation";

export const useDataFilter = (rows: ParsedRow[]) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: null,
    direction: "asc",
  });

  // Calculate statistics
  const stats = useMemo<ImportStats>(() => {
    const total = rows.length;
    const valid = rows.filter(isRowValid).length;
    const errors = rows.filter(
      (row) => row._errors && row._errors.length > 0
    ).length;
    const warnings = rows.filter(
      (row) => row._warnings && row._warnings.length > 0 && isRowValid(row)
    ).length;

    return { total, valid, errors, warnings };
  }, [rows]);

  // Filter and search
  const filteredRows = useMemo(() => {
    let filtered = rows;

    // Apply filter type
    if (filterType === "valid") {
      filtered = filtered.filter(isRowValid);
    } else if (filterType === "errors") {
      filtered = filtered.filter(
        (row) => row._errors && row._errors.length > 0
      );
    } else if (filterType === "warnings") {
      filtered = filtered.filter(
        (row) => row._warnings && row._warnings.length > 0 && isRowValid(row)
      );
    }

    // Apply search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (row) =>
          row.name.toLowerCase().includes(term) ||
          row.sku?.toLowerCase().includes(term) ||
          row.barcode?.toLowerCase().includes(term)
      );
    }

    // Apply sorting
    if (sortConfig.key) {
      filtered = [...filtered].sort((a, b) => {
        const aValue = a[sortConfig.key!];
        const bValue = b[sortConfig.key!];

        if (aValue === undefined || aValue === null) return 1;
        if (bValue === undefined || bValue === null) return -1;

        const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        return sortConfig.direction === "asc" ? comparison : -comparison;
      });
    }

    return filtered;
  }, [rows, filterType, searchTerm, sortConfig]);

  // Sort handler
  const handleSort = useCallback((key: keyof ParsedRow) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  }, []);

  // Clear filters
  const clearFilters = useCallback(() => {
    setSearchTerm("");
    setFilterType("all");
    setSortConfig({ key: null, direction: "asc" });
  }, []);

  return {
    searchTerm,
    setSearchTerm,
    filterType,
    setFilterType,
    sortConfig,
    handleSort,
    stats,
    filteredRows,
    clearFilters,
    hasActiveFilters: searchTerm !== "" || filterType !== "all",
  };
};
