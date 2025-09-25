// src/components/inventory/AdjustStockModal.tsx
import React, { useState, useCallback } from "react";
import { Settings, X } from "lucide-react";
import { useVisibleItems } from "@/stores/selectors";
import { useCreateMovement } from "@/hooks/useCreateMovement";
import { getActionLabels } from "@/utils/workspaceLabels";
import { useWorkspaceStore } from "@/stores/workspaceStore";

interface AdjustStockModalProps {
  itemId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const AdjustStockModal: React.FC<AdjustStockModalProps> = React.memo(
  ({ itemId, isOpen, onClose }) => {
    const createMovement = useCreateMovement();
    const [adjustmentType, setAdjustmentType] = useState<
      "IN" | "OUT" | "USE" | "ADJUST"
    >("ADJUST");
    const [qty, setQty] = useState<number | "">(0);
    const [reason, setReason] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // 현재 아이템 정보 가져오기
    const items = useVisibleItems();
    const currentItem = items.find((item) => item.id === itemId);
    const currentStock = currentItem?.stock || 0;

    const submit = useCallback(async () => {
      const n = typeof qty === "number" ? qty : 0;
      if (n <= 0 && adjustmentType !== "ADJUST") return onClose();

      setIsSubmitting(true);
      try {
        if (adjustmentType === "ADJUST") {
          await createMovement({
            type: "ADJUST",
            itemId,
            qty: n,
            reason: reason || `재고조정: ${currentStock}개 → ${n}개`,
            isAbsoluteValue: true,
          });
        } else {
          await createMovement({
            type: adjustmentType,
            itemId,
            qty: n,
            reason: reason || adjustmentType,
          });
        }
        onClose();
      } catch (error) {
        console.error("Adjust movement failed:", error);
        onClose();
      } finally {
        setIsSubmitting(false);
      }
    }, [
      adjustmentType,
      qty,
      reason,
      itemId,
      currentStock,
      createMovement,
      onClose,
    ]);

    const getCurrentWorkspace = useWorkspaceStore((s) => s.getCurrentWorkspace);
    const currentWorkspace = getCurrentWorkspace();
    const actionLabels = getActionLabels(currentWorkspace?.type || "DEFAULT");

    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Settings className="w-5 h-5 mr-2 text-blue-600" />
              재고 조정
            </h3>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* 현재 재고 표시 */}
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600">현재 재고</div>
            <div className="text-2xl font-bold text-gray-900">
              {currentStock.toLocaleString()}개
            </div>
          </div>

          <div className="gap-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                조정 유형
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustmentType("IN")}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    adjustmentType === "IN"
                      ? "bg-green-100 text-green-800 border border-green-200"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {actionLabels.IN}
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustmentType("OUT")}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    adjustmentType === "OUT"
                      ? "bg-red-100 text-red-800 border border-red-200"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {actionLabels.OUT}
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustmentType("USE")}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    adjustmentType === "USE"
                      ? "bg-blue-100 text-blue-800 border border-blue-200"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {actionLabels.USE}
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustmentType("ADJUST")}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    adjustmentType === "ADJUST"
                      ? "bg-orange-100 text-orange-800 border border-orange-200"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {actionLabels.ADJUST}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {adjustmentType === "ADJUST" ? "최종 재고 수량" : "수량"}
              </label>
              <input
                type="number"
                value={qty}
                onChange={(e) =>
                  setQty(e.target.value ? Number(e.target.value) : "")
                }
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={
                  adjustmentType === "ADJUST"
                    ? "최종 재고 수량 입력"
                    : "수량 입력"
                }
              />
              {/* ADJUST 모드일 때 변화량 표시 */}
              {adjustmentType === "ADJUST" &&
                typeof qty === "number" &&
                qty !== currentStock && (
                  <p
                    className={`text-sm mt-1 ${
                      qty > currentStock ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {qty > currentStock ? "+" : ""}
                    {qty - currentStock}개 변화
                  </p>
                )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                사유 (선택)
              </label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="조정 사유를 입력하세요"
              />
            </div>
          </div>

          <div className="flex space-x-3 mt-6">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              취소
            </button>
            <button
              onClick={submit}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? "처리 중..." : "적용"}
            </button>
          </div>
        </div>
      </div>
    );
  }
);

AdjustStockModal.displayName = "AdjustStockModal";
