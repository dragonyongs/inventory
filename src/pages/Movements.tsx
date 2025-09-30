// src/pages/Movements.tsx

import { useMemo, useState, useCallback } from "react";
import { useFilteredMovements } from "../stores/selectors";
import { useWorkspaceStore } from "../stores/workspaceStore";
import { getActionLabels, type ActionLabels } from "../utils/workspaceLabels";
import { InventoryFilters } from "@/components/inventory/InventoryFilters";
import { useSetQuery, useQuery } from "../stores/selectors";
import { useMovementsStore } from "@/stores/movementsStore";
import { PageHeader } from "@/components/shared/PageHeader";
import { MovementsTable } from "@/components/movements/MovementsTable";
import { EmptyMovementsState } from "@/components/movements/EmptyMovementsState";

export default function Movements() {
  const filteredMovements = useFilteredMovements();
  const { getCurrentWorkspace } = useWorkspaceStore();
  const currentWorkspace = getCurrentWorkspace();
  const setQuery = useSetQuery();
  const q = useQuery();
  const removeMovement = useMovementsStore((s) => s.removeMovement);

  // 📌 추가 필터 상태들
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [dateFilter, setDateFilter] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);

  // 워크스페이스 액션 라벨 (✅ ActionLabels 인터페이스와 정확히 일치)
  const actionLabels = useMemo<ActionLabels>(
    () =>
      currentWorkspace
        ? getActionLabels(currentWorkspace.type)
        : {
            IN: "📥 입고",
            OUT: "📤 출고",
            USE: "✋ 사용",
            ADJUST: "📋 조정",
          },
    [currentWorkspace]
  );

  // 📌 필터링된 이동내역들
  const filtered = useMemo(() => {
    let result = [...filteredMovements];

    // 타입 필터
    if (typeFilter) {
      result = result.filter((m) => m.type === typeFilter);
    }

    // 날짜 필터
    if (dateFilter) {
      const now = Date.now();
      const day = 24 * 60 * 60 * 1000;

      result = result.filter((m) => {
        const movementTime = new Date(m.createdAt).getTime();

        switch (dateFilter) {
          case "today":
            return now - movementTime < day;
          case "week":
            return now - movementTime < 7 * day;
          case "month":
            return now - movementTime < 30 * day;
          default:
            return true;
        }
      });
    }

    return result;
  }, [filteredMovements, typeFilter, dateFilter]);

  // 최신순 정렬 및 최대 50개
  const sorted = useMemo(() => {
    return [...filtered]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, 50);
  }, [filtered]);

  // 📌 활성 필터 개수 계산
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (typeFilter) count++;
    if (dateFilter) count++;
    return count;
  }, [typeFilter, dateFilter]);

  // 검색 핸들러
  const handleSearchChange = useCallback(
    (value: string) => {
      setQuery(value);
    },
    [setQuery]
  );

  // 📌 필터 핸들러들
  const handleToggleFilters = useCallback(() => {
    setShowFilters((prev) => !prev);
  }, []);

  // 삭제 핸들러
  const handleDelete = useCallback(
    (id: string) => {
      if (window.confirm("이 이동 내역을 삭제하시겠습니까?")) {
        removeMovement(id);
      }
    },
    [removeMovement]
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 px-4 lg:px-6">
        {/* 헤더 */}
        <PageHeader
          title="이동내역"
          description="재고 입출고 내역을 확인하세요"
        />
      </div>

      {/* 📌 필터 컴포넌트 */}
      <InventoryFilters
        searchQuery={q}
        onSearchChange={handleSearchChange}
        showFilters={showFilters}
        onToggleFilters={handleToggleFilters}
        activeFiltersCount={activeFiltersCount}
        statusFilter={typeFilter}
        onStatusFilterChange={setTypeFilter}
        stockFilter={dateFilter}
        onStockFilterChange={setDateFilter}
        expiryFilter=""
        onExpiryFilterChange={() => {}}
      />

      {/* 이동내역 목록 */}
      {sorted.length > 0 ? (
        <div className="p-6">
          <MovementsTable
            movements={sorted}
            onDelete={handleDelete}
            actionLabels={actionLabels}
          />
        </div>
      ) : (
        <EmptyMovementsState
          hasFilters={activeFiltersCount > 0}
          searchQuery={q}
        />
      )}

      {/* 📌 필터 결과 요약 */}
      {(q.trim() || activeFiltersCount > 0) && sorted.length > 0 && (
        <div className="mt-4 text-sm text-gray-600 flex items-center justify-center">
          <span>{sorted.length}개 이동내역이 조건에 맞습니다</span>
          {sorted.length !== filteredMovements.length && (
            <span className="text-gray-500">
              전체 {filteredMovements.length}개 중{" "}
              {filteredMovements.length - sorted.length}개 숨겨짐
            </span>
          )}
        </div>
      )}
    </div>
  );
}
