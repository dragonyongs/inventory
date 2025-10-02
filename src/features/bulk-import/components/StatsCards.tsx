import React from "react";
import { Package, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import type { ImportStats } from "../types";
import { formatNumber } from "../utils/formatters";

type StatsCardsProps = {
  stats: ImportStats;
};

const STAT_ITEMS = [
  {
    key: "total",
    label: "전체",
    icon: Package,
    color: "gray",
  },
  {
    key: "valid",
    label: "정상",
    icon: CheckCircle,
    color: "green",
  },
  {
    key: "errors",
    label: "오류",
    icon: XCircle,
    color: "red",
  },
  {
    key: "warnings",
    label: "경고",
    icon: AlertTriangle,
    color: "yellow",
  },
] as const;

export const StatsCards: React.FC<StatsCardsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {STAT_ITEMS.map(({ key, label, icon: Icon, color }) => {
        const value = stats[key as keyof ImportStats];

        return (
          <div
            key={key}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 mb-1">{label}</p>
                <p className="text-2xl font-semibold text-gray-900 tabular-nums">
                  {formatNumber(value)}
                </p>
              </div>
              <div
                className={`
                  w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0
                  ${
                    color === "gray"
                      ? "bg-gray-100"
                      : color === "green"
                      ? "bg-green-100"
                      : color === "red"
                      ? "bg-red-100"
                      : "bg-yellow-100"
                  }
                `}
              >
                <Icon
                  className={`
                    w-5 h-5
                    ${
                      color === "gray"
                        ? "text-gray-600"
                        : color === "green"
                        ? "text-green-600"
                        : color === "red"
                        ? "text-red-600"
                        : "text-yellow-600"
                    }
                  `}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
