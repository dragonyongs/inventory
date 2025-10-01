// src/components/dashboard/StatsCard.tsx
import React from "react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    label: string;
  };
  onClick?: () => void;
}

export const StatsCard: React.FC<StatsCardProps> = React.memo(
  ({ title, value, icon, trend, onClick }) => {
    return (
      <div
        onClick={onClick}
        className={`bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-all duration-300 ${
          onClick ? "cursor-pointer" : ""
        }`}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="p-3 bg-blue-50 rounded-xl">{icon}</div>
          {trend && (
            <div
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${
                trend.value > 0
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {trend.value > 0 ? (
                <ArrowUpRight className="w-3 h-3" />
              ) : (
                <ArrowDownRight className="w-3 h-3" />
              )}
              {Math.abs(trend.value)}%
            </div>
          )}
        </div>
        <h3 className="text-gray-600 text-sm font-medium mb-1">{title}</h3>
        <p className="text-3xl font-bold text-gray-900">{value}</p>
        {trend && <p className="text-xs text-gray-500 mt-2">{trend.label}</p>}
      </div>
    );
  }
);

StatsCard.displayName = "StatsCard";
