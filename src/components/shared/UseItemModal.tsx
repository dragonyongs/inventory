// src/components/shared/UseItemModal.tsx

import React, { useState, useCallback } from "react";
import { X, Minus, Plus, User, FileText, Package } from "lucide-react";
import { Item } from "@/stores/itemsStore";
import { AuthUser } from "@/stores/authStore";

interface UseItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: Item;
  onConfirm: (
    itemId: string,
    quantity: number,
    reason: string,
    userName?: string
  ) => void;
  isAuthenticated: boolean;
  user: AuthUser | null;
}

export const UseItemModal: React.FC<UseItemModalProps> = React.memo(
  ({ isOpen, onClose, item, onConfirm, isAuthenticated, user }) => {
    const [quantity, setQuantity] = useState(1);
    const [reason, setReason] = useState("");
    const [userName, setUserName] = useState(user?.name || "");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleQuantityChange = useCallback(
      (delta: number) => {
        setQuantity((prev) => Math.max(1, Math.min(item.stock, prev + delta)));
      },
      [item.stock]
    );

    const handleSubmit = useCallback(
      async (e: React.FormEvent) => {
        e.preventDefault();

        if (quantity <= 0 || quantity > item.stock) {
          alert("올바른 수량을 입력해주세요.");
          return;
        }

        // ✅ 비로그인 사용자의 경우 이름 필수
        if (!isAuthenticated && !userName.trim()) {
          alert("사용자 이름을 입력해주세요.");
          return;
        }

        setIsSubmitting(true);

        try {
          await onConfirm(
            item.id,
            quantity,
            reason.trim() || "재고 사용",
            isAuthenticated ? user?.name : userName.trim()
          );

          // 폼 초기화
          setQuantity(1);
          setReason("");
          if (!isAuthenticated) {
            setUserName("");
          }

          onClose();
        } catch (error) {
          console.error("사용 처리 중 오류:", error);
        } finally {
          setIsSubmitting(false);
        }
      },
      [
        quantity,
        item.stock,
        item.id,
        isAuthenticated,
        userName,
        reason,
        onConfirm,
        onClose,
        user,
      ]
    );

    const handleBackdropClick = useCallback(
      (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      },
      [onClose]
    );

    if (!isOpen) return null;

    return (
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={handleBackdropClick}
      >
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md border border-gray-100 transform transition-all">
          {/* 헤더 */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Package className="w-5 h-5 text-blue-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">
                  재고 사용
                </h3>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
                aria-label="모달 닫기"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* 본문 */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* 상품 정보 */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">{item.name}</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <div>
                  현재 재고: <span className="font-medium">{item.stock}개</span>
                </div>
                {item.sku && <div>SKU: {item.sku}</div>}
                {item.defaultPrice && (
                  <div>단가: {item.defaultPrice.toLocaleString()}원</div>
                )}
              </div>
            </div>

            {/* 사용량 선택 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                사용할 수량
              </label>
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => handleQuantityChange(-1)}
                  disabled={quantity <= 1}
                  className="flex items-center justify-center w-10 h-10 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Minus className="w-4 h-4" />
                </button>

                <input
                  type="number"
                  min="1"
                  max={item.stock}
                  value={quantity}
                  onChange={(e) =>
                    setQuantity(
                      Math.max(
                        1,
                        Math.min(item.stock, parseInt(e.target.value) || 1)
                      )
                    )
                  }
                  className="flex-1 text-center text-lg font-semibold py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />

                <button
                  type="button"
                  onClick={() => handleQuantityChange(1)}
                  disabled={quantity >= item.stock}
                  className="flex items-center justify-center w-10 h-10 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-2 text-center">
                <span className="text-sm text-gray-500">
                  총 사용량: <span className="font-medium">{quantity}개</span>
                  {item.defaultPrice && (
                    <>
                      {" "}
                      • 총 금액:{" "}
                      <span className="font-medium">
                        {(quantity * item.defaultPrice).toLocaleString()}원
                      </span>
                    </>
                  )}
                </span>
              </div>
            </div>

            {/* 사용자 정보 (비로그인 사용자) */}
            {!isAuthenticated && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  사용자 이름 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="이름을 입력하세요"
                    required
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}

            {/* 사용 사유 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                사용 사유 <span className="text-gray-400">(선택사항)</span>
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="사용 목적이나 사유를 간단히 적어주세요"
                  rows={3}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>
            </div>

            {/* 버튼 */}
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 text-gray-700 font-medium hover:bg-gray-100 rounded-lg transition-colors"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={
                  isSubmitting ||
                  quantity <= 0 ||
                  quantity > item.stock ||
                  (!isAuthenticated && !userName.trim())
                }
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {isSubmitting ? "처리 중..." : "사용하기"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }
);

UseItemModal.displayName = "UseItemModal";
