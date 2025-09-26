// src/components/shared/UseItemModal.tsx

import React, { useState, useCallback } from "react";
import {
  X,
  Minus,
  Plus,
  User,
  FileText,
  ShoppingCart,
  Calculator,
} from "lucide-react";
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

    const totalValue = item.defaultPrice ? quantity * item.defaultPrice : 0;

    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={handleBackdropClick}
      >
        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl transform transition-all duration-300 scale-100">
          {/* 📌 헤더 */}
          <div className="relative px-6 py-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">재고 사용</h2>
                <p className="text-sm text-gray-600 mt-0.5">
                  필요한 수량을 선택해주세요
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-6">
            {/* 📌 상품 정보 카드 */}
            <div className="mb-6 p-4 bg-gray-50 rounded-2xl">
              <h3 className="font-bold text-gray-900 mb-2">{item.name}</h3>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">현재 재고</span>
                <span className="font-semibold text-gray-900">
                  {item.stock}개
                </span>
              </div>
              {item.sku && (
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-gray-600">SKU</span>
                  <span className="font-mono text-gray-900">{item.sku}</span>
                </div>
              )}
              {item.defaultPrice && (
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-gray-600">단가</span>
                  <span className="font-semibold text-gray-900">
                    {item.defaultPrice.toLocaleString()}원
                  </span>
                </div>
              )}
            </div>

            {/* 📌 수량 선택 */}
            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-900 mb-3">
                사용할 수량
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleQuantityChange(-1)}
                  disabled={quantity <= 1}
                  className={`
                    flex items-center justify-center w-12 h-12 rounded-xl font-bold transition-all
                    ${
                      quantity <= 1
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200 active:scale-95"
                    }
                  `}
                >
                  <Minus className="w-4 h-4" />
                </button>

                <div className="flex-1 relative">
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
                    className="w-full text-center text-xl font-bold py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => handleQuantityChange(1)}
                  disabled={quantity >= item.stock}
                  className={`
                    flex items-center justify-center w-12 h-12 rounded-xl font-bold transition-all
                    ${
                      quantity >= item.stock
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200 active:scale-95"
                    }
                  `}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* 총액 표시 */}
              {totalValue > 0 && (
                <div className="mt-4 p-3 bg-blue-50 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-semibold text-blue-700">
                      <Calculator className="w-4 h-4" />총 사용 가치
                    </div>
                    <div className="text-lg font-bold text-blue-900">
                      {totalValue.toLocaleString()}원
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 📌 사용자 정보 (비로그인 사용자) */}
            {!isAuthenticated && (
              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-900 mb-3">
                  사용자 이름 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2">
                    <User className="w-4 h-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="이름을 입력하세요"
                    required
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>
            )}

            {/* 📌 사용 사유 */}
            <div className="mb-8">
              <label className="block text-sm font-bold text-gray-900 mb-3">
                사용 사유 <span className="text-gray-500">(선택사항)</span>
              </label>
              <div className="relative">
                <div className="absolute left-3 top-3">
                  <FileText className="w-4 h-4 text-gray-400" />
                </div>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="사용 목적이나 사유를 간단히 적어주세요"
                  rows={3}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all"
                />
              </div>
            </div>

            {/* 📌 액션 버튼 */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3.5 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 active:scale-95 transition-all"
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
                className={`
                  flex-1 px-4 py-3.5 font-bold rounded-xl transition-all transform
                  ${
                    isSubmitting ||
                    quantity <= 0 ||
                    quantity > item.stock ||
                    (!isAuthenticated && !userName.trim())
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl active:scale-95"
                  }
                `}
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    처리 중...
                  </div>
                ) : (
                  "사용하기"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }
);

UseItemModal.displayName = "UseItemModal";
