// src/components/common/ShareModal.tsx

import React, { useState, useCallback } from "react";
import { Copy, Eye, Edit3, Check, X } from "lucide-react";

export type SharePermission = "view" | "use";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (permission: SharePermission) => void;
  shareUrl?: string;
}

export const ShareModal: React.FC<ShareModalProps> = React.memo(
  ({ isOpen, onClose, onGenerate, shareUrl }) => {
    const [permission, setPermission] = useState<SharePermission>("view");
    const [copied, setCopied] = useState(false);

    const handleCopyUrl = useCallback(async () => {
      if (!shareUrl) return;

      try {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error("Failed to copy URL:", error);
        // Fallback for older browsers
        try {
          const textArea = document.createElement("textarea");
          textArea.value = shareUrl;
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand("copy");
          document.body.removeChild(textArea);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch (fallbackError) {
          console.error("Fallback copy also failed:", fallbackError);
        }
      }
    }, [shareUrl]);

    const handleGenerate = useCallback(() => {
      onGenerate(permission);
    }, [onGenerate, permission]);

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
              <h3 className="text-lg font-semibold text-gray-900">재고 공유</h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
                aria-label="모달 닫기"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              현재 카테고리의 재고를 외부에 공유할 수 있습니다
            </p>
          </div>

          {/* 본문 */}
          <div className="p-6 space-y-4">
            {/* 권한 선택 */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-3 block">
                공유 권한 선택
              </label>
              <div className="space-y-3">
                {/* 보기 전용 */}
                <label className="flex items-start p-4 border-2 border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-all duration-200 group">
                  <input
                    type="radio"
                    name="permission"
                    value="view"
                    checked={permission === "view"}
                    onChange={(e) =>
                      setPermission(e.target.value as SharePermission)
                    }
                    className="mt-0.5 text-blue-600 focus:ring-blue-500 focus:ring-2"
                  />
                  <div className="ml-3 flex-1">
                    <div className="flex items-center mb-1">
                      <Eye className="w-4 h-4 text-blue-600 mr-2" />
                      <span className="font-medium text-gray-900">
                        보기 전용
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      재고 현황을 조회할 수만 있습니다. 수정이나 사용은
                      불가능합니다.
                    </p>
                  </div>
                </label>

                {/* 사용 가능 */}
                <label className="flex items-start p-4 border-2 border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-all duration-200 group">
                  <input
                    type="radio"
                    name="permission"
                    value="use"
                    checked={permission === "use"}
                    onChange={(e) =>
                      setPermission(e.target.value as SharePermission)
                    }
                    className="mt-0.5 text-blue-600 focus:ring-blue-500 focus:ring-2"
                  />
                  <div className="ml-3 flex-1">
                    <div className="flex items-center mb-1">
                      <Edit3 className="w-4 h-4 text-green-600 mr-2" />
                      <span className="font-medium text-gray-900">
                        사용 가능
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      재고 조회 및 사용(차감)이 가능합니다. 사용 시 사유를
                      기록합니다.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* 생성된 공유 링크 */}
            {shareUrl && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 block">
                  공유 링크
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    value={shareUrl}
                    readOnly
                    className="flex-1 px-3 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-sm text-gray-700 font-mono"
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                  />
                  <button
                    onClick={handleCopyUrl}
                    className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-all min-w-[80px] ${
                      copied
                        ? "bg-green-100 text-green-700 border border-green-200"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200"
                    }`}
                    title={copied ? "복사완료!" : "링크 복사"}
                  >
                    {copied ? (
                      <div className="flex items-center justify-center">
                        <Check className="w-4 h-4 mr-1" />
                        완료
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        <Copy className="w-4 h-4 mr-1" />
                        복사
                      </div>
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500">
                  링크를 복사해서 다른 사람과 공유하세요. 권한은{" "}
                  <span className="font-medium">
                    {permission === "view" ? "보기 전용" : "사용 가능"}
                  </span>
                  로 설정됩니다.
                </p>
              </div>
            )}
          </div>

          {/* 푸터 */}
          <div className="p-6 border-t border-gray-100 flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-100 rounded-lg transition-colors"
            >
              취소
            </button>
            {!shareUrl && (
              <button
                onClick={handleGenerate}
                className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
              >
                공유 링크 생성
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }
);

ShareModal.displayName = "ShareModal";
