// src/components/inventory/InventoryFilters.tsx
import React from "react";
import { Search } from "lucide-react";

interface InventoryFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
}

export const InventoryFilters: React.FC<InventoryFiltersProps> = React.memo(
  ({ searchQuery, onSearchChange }) => {
    return (
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="상품명, SKU, 바코드로 검색..."
          className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-4 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    );
  }
);
InventoryFilters.displayName = "InventoryFilters";
