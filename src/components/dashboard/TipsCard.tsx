// src/components/dashboard/TipsCard.tsx

import React from "react";
import { Zap, Upload, CheckCircle2 } from "lucide-react";

interface TipsCardProps {
  onBulkImport?: () => void;
}

export const TipsCard: React.FC<TipsCardProps> = React.memo(
  ({ onBulkImport }) => {
    const tips = [
      "정기적으로 재고 수준을 점검하고 최소 재고량을 설정하세요",
      "유통기한이 있는 제품은 FIFO(선입선출) 원칙을 적용하세요",
      "바코드 스캔을 활용하여 입출고 기록의 정확성을 높이세요",
    ];

    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        {/* 헤더 */}
        <div className="mb-5 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50">
            <Zap className="h-5 w-5 text-indigo-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900">재고 관리 팁</h3>
        </div>

        {/* 팁 목록 */}
        <div className="space-y-3">
          {tips.map((tip, index) => (
            <div key={index} className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-500" />
              <p className="text-sm leading-relaxed text-slate-600">{tip}</p>
            </div>
          ))}
        </div>

        {/* 대량 업로드 버튼 */}
        {onBulkImport && (
          <button
            onClick={onBulkImport}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-medium text-indigo-700 transition-all hover:border-indigo-300 hover:bg-indigo-100 hover:shadow-sm"
          >
            <Upload className="h-4 w-4" />
            대량 업로드
          </button>
        )}
      </div>
    );
  }
);

TipsCard.displayName = "TipsCard";
