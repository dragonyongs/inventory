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

    // 현재 아이템 정보 가져오기
    const items = useVisibleItems();
    const currentItem = items.find((item) => item.id === itemId);
    const currentStock = currentItem?.stock || 0;

    // 애니메이션 효과
    useEffect(() => {
      if (isOpen) {
        // 모달 열릴 때 애니메이션
        requestAnimationFrame(() => {
          setIsAnimating(true);
        });
      } else {
        setIsAnimating(false);
      }
    }, [isOpen]);

    // ESC 키로 닫기
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

    if (!isOpen) return null;

    return (
      <>
        {/* Backdrop with blur - 프리미엄 배경 효과 */}
        <div
          className={`fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm transition-opacity duration-300 ease-out sm:items-center sm:p-4 ${
            isAnimating ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => !isSubmitting && onClose()}
          aria-hidden="true"
        >
          {/* Modal Container - 모바일은 하단 슬라이드, 데스크톱은 중앙 */}
          <div
            className={`relative w-full max-w-lg transform rounded-t-3xl bg-white shadow-2xl transition-all duration-300 ease-out sm:rounded-2xl ${
              isAnimating
                ? "translate-y-0 opacity-100 sm:scale-100"
                : "translate-y-full opacity-0 sm:translate-y-0 sm:scale-95"
            }`}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            {/* 모바일 드래그 핸들 */}
            <div className="flex justify-center pb-2 pt-3 sm:hidden">
              <div className="h-1.5 w-12 rounded-full bg-gray-300" />
            </div>

            {/* Header */}
            <div className="border-b border-gray-100 px-6 pb-4 pt-2 sm:pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
                    <Settings className="h-5 w-5 text-blue-600" />
                  </div>
                  <h2
                    id="modal-title"
                    className="text-xl font-bold text-gray-900"
                  >
                    재고 조정
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-gray-400 transition-all duration-200 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
                  aria-label="닫기"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="max-h-[70vh] overflow-y-auto px-6 py-6">
              {/* 현재 재고 - 카드 스타일 */}
              <div className="mb-6 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
                <p className="text-sm font-medium text-gray-600">현재 재고</p>
                <p className="mt-1 text-3xl font-bold text-gray-900">
                  {currentStock.toLocaleString()}
                  <span className="ml-1 text-lg font-medium text-gray-600">
                    개
                  </span>
                </p>
              </div>

              {/* 조정 유형 - 개선된 버튼 그룹 */}
              <div className="mb-6">
                <label className="mb-3 block text-sm font-semibold text-gray-700">
                  조정 유형
                </label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
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
                      onClick={() => setAdjustmentType(type)}
                      className={`relative overflow-hidden rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 ${
                        adjustmentType === type
                          ? `bg-${color}-500 text-white shadow-lg shadow-${color}-500/30 ring-2 ring-${color}-500 ring-offset-2`
                          : "bg-gray-50 text-gray-700 hover:bg-gray-100 active:scale-95"
                      }`}
                    >
                      {label}
                      {adjustmentType === type && (
                        <span className="absolute inset-0 bg-white/20" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* 수량 입력 */}
              <div className="mb-5">
                <label
                  htmlFor="qty-input"
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  {adjustmentType === "ADJUST" ? "최종 재고 수량" : "수량"}
                </label>
                <div className="relative">
                  <input
                    id="qty-input"
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

                {/* ADJUST 모드일 때 변화량 표시 - 개선된 UI */}
                {adjustmentType === "ADJUST" &&
                  typeof qty === "number" &&
                  qty !== currentStock && (
                    <div
                      className={`mt-3 flex items-center space-x-2 rounded-xl px-4 py-2.5 ${
                        qty > currentStock ? "bg-green-50" : "bg-red-50"
                      }`}
                    >
                      <div
                        className={`flex h-6 w-6 items-center justify-center rounded-full ${
                          qty > currentStock
                            ? "bg-green-500 text-white"
                            : "bg-red-500 text-white"
                        }`}
                      >
                        <span className="text-xs font-bold">
                          {qty > currentStock ? "+" : "-"}
                        </span>
                      </div>
                      <span
                        className={`text-sm font-semibold ${
                          qty > currentStock ? "text-green-700" : "text-red-700"
                        }`}
                      >
                        {Math.abs(qty - currentStock).toLocaleString()}개 변화
                      </span>
                    </div>
                  )}
              </div>

              {/* 사유 입력 */}
              <div className="mb-2">
                <label
                  htmlFor="reason-input"
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  사유 <span className="font-normal text-gray-500">(선택)</span>
                </label>
                <textarea
                  id="reason-input"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  className="w-full resize-none rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-sm transition-all duration-200 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                  placeholder="조정 사유를 입력하세요"
                />
              </div>
            </div>

            {/* Footer - Sticky buttons */}
            <div className="border-t border-gray-100 bg-gray-50 px-6 py-4">
              <div className="flex space-x-3">
                <button
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="flex-1 rounded-xl border-2 border-gray-200 bg-white px-4 py-3.5 font-semibold text-gray-700 transition-all duration-200 hover:bg-gray-50 active:scale-95 disabled:opacity-50"
                >
                  취소
                </button>
                <button
                  onClick={submit}
                  disabled={
                    isSubmitting ||
                    (typeof qty === "number" &&
                      qty <= 0 &&
                      adjustmentType !== "ADJUST")
                  }
                  className="flex-1 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3.5 font-semibold text-white shadow-lg shadow-blue-500/30 transition-all duration-200 hover:shadow-xl hover:shadow-blue-500/40 active:scale-95 disabled:opacity-50 disabled:shadow-none"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center">
                      <svg
                        className="mr-2 h-5 w-5 animate-spin"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      처리 중...
                    </span>
                  ) : (
                    "적용"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }
);

AdjustStockModal.displayName = "AdjustStockModal";
