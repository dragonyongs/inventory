// src/components/dashboard/TipsCard.tsx
import React from "react";
import { Zap, Upload } from "lucide-react";

interface TipsCardProps {
  onBulkImport?: () => void;
}

export const TipsCard: React.FC<TipsCardProps> = React.memo(
  ({ onBulkImport }) => {
    return (
      <div className="bg-gradient-to-br from-indigo-50 to-purple-100 rounded-xl border border-indigo-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-5 h-5 text-indigo-600" />
          <h3 className="font-semibold text-indigo-900">재고 관리 팁</h3>
        </div>

        <div className="space-y-3 mb-4">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-indigo-500 mt-2 flex-shrink-0"></div>
            <p className="text-sm text-indigo-800">
              정기적으로 재고 수준을 점검하고 최소 재고량을 설정하세요
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-indigo-500 mt-2 flex-shrink-0"></div>
            <p className="text-sm text-indigo-800">
              유통기한이 있는 제품은 FIFO(선입선출) 원칙을 적용하세요
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-indigo-500 mt-2 flex-shrink-0"></div>
            <p className="text-sm text-indigo-800">
              바코드 스캔을 활용하여 입출고 기록의 정확성을 높이세요
            </p>
          </div>
        </div>

        {onBulkImport && (
          <button
            onClick={onBulkImport}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"
          >
            <Upload className="w-4 h-4" />
            대량 업로드
          </button>
        )}
      </div>
    );
  }
);

TipsCard.displayName = "TipsCard";
