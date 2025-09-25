// src/components/inventory/AddCategoryModal.tsx
import React, { useState, useCallback, useEffect } from "react";
import { X, Folder, Check } from "lucide-react";
import { useCategoriesStore } from "@/stores/categoriesStore";
import { useWorkspaceStore } from "@/stores/workspaceStore";

interface AddCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// 간소화된 아이콘 선택지
const CATEGORY_ICONS = [
  "📦",
  "🏠",
  "🍳",
  "🌿",
  "💊",
  "📚",
  "🎯",
  "⚡",
  "🔧",
  "🎨",
  "🏢",
  "🚗",
  "👕",
  "🎮",
  "💻",
  "📱",
];

export const AddCategoryModal: React.FC<AddCategoryModalProps> = React.memo(
  ({ isOpen, onClose }) => {
    const currentWorkspaceId = useWorkspaceStore((s) => s.currentWorkspaceId);
    const { addCategory } = useCategoriesStore();

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [selectedIcon, setSelectedIcon] = useState("📦");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    // 모달이 열릴 때 첫 번째 입력 필드에 포커스
    useEffect(() => {
      if (isOpen) {
        const timer = setTimeout(() => {
          const input = document.getElementById("category-name-input");
          input?.focus();
        }, 100);
        return () => clearTimeout(timer);
      }
    }, [isOpen]);

    const handleSubmit = useCallback(async () => {
      if (!name.trim() || !currentWorkspaceId) return;

      setIsSubmitting(true);

      try {
        addCategory({
          workspaceId: currentWorkspaceId,
          name: name.trim(),
          description: description.trim() || undefined,
          icon: selectedIcon,
        });

        setShowSuccess(true);

        setTimeout(() => {
          onClose();
          setName("");
          setDescription("");
          setSelectedIcon("📦");
          setShowSuccess(false);
        }, 800);
      } catch (error) {
        console.error("카테고리 추가 실패:", error);
      } finally {
        setIsSubmitting(false);
      }
    }, [
      name,
      description,
      selectedIcon,
      currentWorkspaceId,
      addCategory,
      onClose,
    ]);

    // ESC 키로 모달 닫기
    useEffect(() => {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === "Escape" && isOpen) {
          onClose();
        }
      };

      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
      <>
        {/* 백드롭 */}
        <div
          className="fixed inset-0 bg-black/20 z-50 transition-opacity duration-200"
          onClick={onClose}
        />

        {/* 모달 컨테이너 */}
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-lg">
            {/* 메인 모달 */}
            <div className="bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
              {/* 성공 오버레이 */}
              {showSuccess && (
                <div className="absolute inset-0 bg-white/95 flex items-center justify-center z-10">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Check size={20} className="text-green-600" />
                    </div>
                    <h3 className="text-base font-semibold text-gray-900 mb-1">
                      생성 완료
                    </h3>
                    <p className="text-sm text-gray-600">
                      {name} 카테고리가 추가되었습니다.
                    </p>
                  </div>
                </div>
              )}

              {/* 헤더 */}
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Folder className="w-4 h-4 text-gray-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      새 카테고리
                    </h2>
                    <p className="text-xs text-gray-500">
                      아이템을 정리할 폴더를 만드세요
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors duration-200"
                >
                  <X size={16} />
                </button>
              </div>

              {/* 콘텐츠 */}
              <div className="p-6 space-y-5">
                {/* 카테고리 이름 */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    이름 *
                  </label>
                  <input
                    id="category-name-input"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
                    placeholder="예: 주방용품, 창고A, 베란다"
                    maxLength={20}
                  />
                </div>

                {/* 설명 */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    설명 (선택)
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm resize-none"
                    placeholder="간단한 설명을 입력하세요"
                    rows={2}
                    maxLength={100}
                  />
                </div>

                {/* 아이콘 선택 */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-3">
                    아이콘
                  </label>
                  <div className="grid grid-cols-8 gap-2">
                    {CATEGORY_ICONS.map((icon) => (
                      <button
                        key={icon}
                        onClick={() => setSelectedIcon(icon)}
                        className={`
                          p-2.5 rounded-lg text-base hover:bg-gray-100 transition-colors
                          ${
                            selectedIcon === icon
                              ? "bg-blue-50 border border-blue-200"
                              : "bg-gray-50 border border-gray-200 hover:border-gray-300"
                          }
                        `}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 심플한 미리보기 */}
                <div className="bg-gray-50 p-4 rounded-lg border">
                  <label className="block text-xs font-medium text-gray-700 mb-2">
                    미리보기
                  </label>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-white text-gray-900 border border-gray-200">
                    {selectedIcon && (
                      <span className="text-sm">{selectedIcon}</span>
                    )}
                    <span>{name || "카테고리명"}</span>
                  </div>
                </div>
              </div>

              {/* 하단 버튼 */}
              <div className="flex gap-3 p-6 pt-0">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
                >
                  취소
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!name.trim() || isSubmitting}
                  className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
                >
                  {isSubmitting ? "생성 중..." : "생성"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }
);

AddCategoryModal.displayName = "AddCategoryModal";
