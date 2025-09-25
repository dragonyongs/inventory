// src/components/inventory/StockAdjustmentModal.tsx
import React, { useState, useCallback, useEffect } from "react";
import { X, Plus, Minus } from "lucide-react";
import type { Item } from "@/stores/itemsStore";

interface StockAdjustmentModalProps {
  isOpen: boolean;
  item: Item | null;
  currentStock: number;
  onClose: () => void;
  onAdjust: (
    itemId: string,
    newQuantity: number,
    reason: string
  ) => Promise<void>;
}

export const StockAdjustmentModal: React.FC<StockAdjustmentModalProps> =
  React.memo(({ isOpen, item, currentStock, onClose, onAdjust }) => {
    const [quantity, setQuantity] = useState(currentStock);
    const [reason, setReason] = useState("");
    const [isAdjusting, setIsAdjusting] = useState(false);

    useEffect(() => {
      if (isOpen) {
        setQuantity(currentStock);
        setReason("");
      }
    }, [isOpen, currentStock]);

    const handleAdjust = useCallback(async () => {
      if (!item || isAdjusting) return;
      if (quantity === currentStock) {
        onClose();
        return;
      }
      setIsAdjusting(true);
      try {
        await onAdjust(item.id, quantity, reason || "수동 조정");
        onClose();
      } catch (error) {
        console.error("재고 조정 실패:", error);
        alert("재고 조정 중 오류가 발생했습니다.");
      } finally {
        setIsAdjusting(false);
      }
    }, [item, quantity, currentStock, reason, onAdjust, onClose, isAdjusting]);

    if (!isOpen || !item) return null;

    const difference = quantity - currentStock;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">재고 조정</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <div className="font-medium text-gray-900">{item.name}</div>
              <div className="text-sm text-gray-500">
                현재 재고: {currentStock}개
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                조정할 수량
              </label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity(Math.max(0, quantity - 1))}
                  className="p-2 border border-gray-300 rounded hover:bg-gray-50"
                  disabled={isAdjusting}
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) =>
                    setQuantity(Math.max(0, Number(e.target.value) || 0))
                  }
                  className="flex-1 px-3 py-2 border border-gray-300 rounded text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min={0}
                  disabled={isAdjusting}
                />
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-2 border border-gray-300 rounded hover:bg-gray-50"
                  disabled={isAdjusting}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              {difference !== 0 && (
                <div
                  className={`text-sm mt-1 ${
                    difference > 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {difference > 0 ? "+" : ""}
                  {difference}개 변화
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                조정 사유 (선택사항)
              </label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="예: 재고 실사, 분실, 파손 등"
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isAdjusting}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={onClose}
              disabled={isAdjusting}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
            >
              취소
            </button>
            <button
              onClick={handleAdjust}
              disabled={isAdjusting || quantity === currentStock}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {isAdjusting ? "조정 중..." : "조정하기"}
            </button>
          </div>
        </div>
      </div>
    );
  });

StockAdjustmentModal.displayName = "StockAdjustmentModal";
