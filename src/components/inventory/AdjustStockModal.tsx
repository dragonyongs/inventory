// src/components/inventory/AdjustStockModal.tsx
import React, { useState, useCallback, useEffect } from "react";
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
    const [isAnimating, setIsAnimating] = useState(false);

    const items = useVisibleItems();
    const currentItem = items.find((item) => item.id === itemId);
    const currentStock = currentItem?.stock || 0;

    useEffect(() => {
      if (isOpen) {
        requestAnimationFrame(() => {
          setIsAnimating(true);
        });
      } else {
        setIsAnimating(false);
      }
    }, [isOpen]);

    useEffect(() => {
      const handleEsc = (e: KeyboardEvent) => {
        if (e.key === "Escape" && isOpen && !isSubmitting) {
          onClose();
        }
      };
      window.addEventListener("keydown", handleEsc);
      return () => window.removeEventListener("keydown", handleEsc);
    }, [isOpen, isSubmitting, onClose]);

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

    // ✅ 버튼 스타일 함수 (동적 클래스 문제 해결)
    const getButtonStyle = (type: typeof adjustmentType, color: string) => {
      const isActive = adjustmentType === type;

      // 각 색상별로 완전한 클래스명 반환
      const activeStyles = {
        green:
          "bg-green-500 text-white shadow-lg shadow-green-500/30 ring-2 ring-green-500 ring-offset-2",
        red: "bg-red-500 text-white shadow-lg shadow-red-500/30 ring-2 ring-red-500 ring-offset-2",
        blue: "bg-blue-500 text-white shadow-lg shadow-blue-500/30 ring-2 ring-blue-500 ring-offset-2",
        orange:
          "bg-orange-500 text-white shadow-lg shadow-orange-500/30 ring-2 ring-orange-500 ring-offset-2",
      };

      const inactiveStyle =
        "bg-gray-50 text-gray-700 hover:bg-gray-100 active:scale-95";

      return `relative overflow-hidden rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 ${
        isActive
          ? activeStyles[color as keyof typeof activeStyles]
          : inactiveStyle
      }`;
    };

    if (!isOpen) return null;

    return (
      <>
        {/* Backdrop */}
        <div
          className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
            isAnimating ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => !isSubmitting && onClose()}
          aria-hidden="true"
        />

        {/* Modal Container */}
        <div
          className={`fixed inset-x-0 z-50 transition-all duration-300 ease-out
            lg:inset-0 lg:flex lg:items-center lg:justify-center lg:p-4
            ${
              isAnimating
                ? "bottom-0 lg:opacity-100 lg:scale-100"
                : "-bottom-full lg:opacity-0 lg:scale-95"
            }`}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          {/* ✅ 데스크톱에서 하단 보더 추가 */}
          <div className="overflow-hidden w-full bg-white shadow-2xl lg:max-w-md lg:rounded-xl lg:border lg:border-gray-200 rounded-t-3xl max-h-[90vh] flex flex-col">
            {/* 모바일 드래그 핸들 */}
            <div className="flex justify-center pt-3 pb-2 lg:hidden">
              <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Settings className="w-5 h-5 text-blue-600" />
                </div>
                <h2
                  id="modal-title"
                  className="text-lg font-bold text-gray-900"
                >
                  재고 조정
                </h2>
              </div>
              <button
                onClick={onClose}
                disabled={isSubmitting}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                aria-label="닫기"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content - Scrollable */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
              {/* 현재 재고 */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-5 border border-blue-200">
                <div className="text-sm font-medium text-blue-700 mb-2">
                  현재 재고
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-blue-900">
                    {currentStock.toLocaleString()}
                  </span>
                  <span className="text-lg font-medium text-blue-700">개</span>
                </div>
              </div>

              {/* 조정 유형 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  조정 유형
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    {
                      type: "IN" as const,
                      label: actionLabels.IN,
                      color: "green",
                    },
                    {
                      type: "OUT" as const,
                      label: actionLabels.OUT,
                      color: "red",
                    },
                    {
                      type: "USE" as const,
                      label: actionLabels.USE,
                      color: "blue",
                    },
                    {
                      type: "ADJUST" as const,
                      label: actionLabels.ADJUST,
                      color: "orange",
                    },
                  ].map(({ type, label, color }) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setAdjustmentType(type)}
                      className={getButtonStyle(type, color)}
                    >
                      {label}
                      {adjustmentType === type && (
                        <div className="absolute inset-0 bg-white/10 animate-pulse" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* 수량 입력 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {adjustmentType === "ADJUST" ? "최종 재고 수량" : "수량"}
                </label>
                <input
                  type="number"
                  value={qty}
                  onChange={(e) =>
                    setQty(e.target.value ? Number(e.target.value) : "")
                  }
                  min="0"
                  className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3.5 text-base font-medium text-gray-900 transition-all duration-200 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                  placeholder={
                    adjustmentType === "ADJUST"
                      ? "최종 재고 수량 입력"
                      : "수량 입력"
                  }
                />
              </div>

              {/* ADJUST 모드일 때 변화량 표시 */}
              {adjustmentType === "ADJUST" &&
                typeof qty === "number" &&
                qty !== currentStock && (
                  <div
                    className={`rounded-xl border-2 p-4 ${
                      qty > currentStock
                        ? "bg-green-50 border-green-200"
                        : "bg-red-50 border-red-200"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                          qty > currentStock
                            ? "bg-green-500 text-white"
                            : "bg-red-500 text-white"
                        }`}
                      >
                        {qty > currentStock ? "+" : "-"}
                      </div>
                      <span
                        className={`text-sm font-semibold ${
                          qty > currentStock ? "text-green-700" : "text-red-700"
                        }`}
                      >
                        {Math.abs(qty - currentStock).toLocaleString()}개 변화
                      </span>
                    </div>
                  </div>
                )}

              {/* 사유 입력 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  사유 (선택)
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  className="w-full resize-none rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-sm transition-all duration-200 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                  placeholder="조정 사유를 입력하세요"
                />
              </div>
            </div>

            {/* Footer - Sticky buttons */}
            <div className="flex gap-3 border-t border-gray-100 bg-white px-6 py-4">
              <button
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 rounded-xl bg-gray-100 px-6 py-3.5 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-200 disabled:opacity-50 active:scale-95"
              >
                취소
              </button>
              <button
                onClick={submit}
                disabled={isSubmitting}
                className="flex-1 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition-all hover:bg-blue-700 disabled:opacity-50 active:scale-95"
              >
                {isSubmitting ? "처리 중..." : "적용"}
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }
);

AdjustStockModal.displayName = "AdjustStockModal";
