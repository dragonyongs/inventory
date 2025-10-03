// src/components/dashboard/StatsCards.tsx

import React from "react";
import { useNavigate } from "react-router-dom";
import { Package, TrendingUp, AlertTriangle, Calendar } from "lucide-react";
import { StatsCard } from "./StatsCard";

interface StatsData {
  totalItems: number;
  lowStockItems: number;
  recentMovements: number;
  totalStock: number;
}

interface StatsCardsProps {
  stats: StatsData;
}

export const StatsCards: React.FC<StatsCardsProps> = React.memo(({ stats }) => {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatsCard
        title="전체 상품"
        value={stats.totalItems}
        icon={<Package />}
        onClick={() => navigate("/inventory")}
      />

      <StatsCard
        title="재고 부족"
        value={stats.lowStockItems}
        icon={<AlertTriangle />}
        trend={
          stats.lowStockItems > 0 ? { value: 5, label: "주의 필요" } : undefined
        }
        onClick={() => navigate("/inventory?filter=low-stock")}
      />

      <StatsCard
        title="최근 움직임"
        value={stats.recentMovements}
        icon={<TrendingUp />}
        trend={{ value: 12, label: "지난 주 대비" }}
        onClick={() => navigate("/movements")}
      />

      <StatsCard title="총 재고" value={stats.totalStock} icon={<Calendar />} />
    </div>
  );
});

StatsCards.displayName = "StatsCards";
