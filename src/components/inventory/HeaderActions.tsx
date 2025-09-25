// src/components/inventory/HeaderActions.tsx

import React, { useState, useCallback } from "react";
import { Plus, Share2 } from "lucide-react";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { useCategoriesStore } from "@/stores/categoriesStore";
import {
  ShareModal,
  type SharePermission,
} from "@/components/common/ShareModal";

interface HeaderActionsProps {
  onNewItem?: () => void;
}

export const HeaderActions: React.FC<HeaderActionsProps> = React.memo(
  ({ onNewItem }) => {
    const currentWorkspaceId = useWorkspaceStore((s) => s.currentWorkspaceId);
    const currentCategoryId = useCategoriesStore((s) => s.currentCategoryId);
    const { generateShareToken } = useCategoriesStore();

    const [shareModalOpen, setShareModalOpen] = useState(false);
    const [shareUrl, setShareUrl] = useState<string>();
    const [currentPermission, setCurrentPermission] =
      useState<SharePermission>("view"); // ✅ 현재 권한 상태 추가

    const handleShare = useCallback(() => {
      if (!currentWorkspaceId || !currentCategoryId) {
        alert("워크스페이스와 카테고리를 먼저 선택해주세요.");
        return;
      }
      setShareModalOpen(true);
    }, [currentWorkspaceId, currentCategoryId]);

    const handleGenerateShare = useCallback(
      (permission: SharePermission) => {
        if (!currentWorkspaceId || !currentCategoryId) return;

        const token = generateShareToken(currentCategoryId);
        const baseUrl = window.location.origin;
        const url = `${baseUrl}/share/${token}?permission=${permission}&workspace=${currentWorkspaceId}&category=${currentCategoryId}`;

        setShareUrl(url);
        setCurrentPermission(permission);
      },
      [currentWorkspaceId, currentCategoryId, generateShareToken]
    );

    const handleCloseShareModal = useCallback(() => {
      setShareModalOpen(false);
      setShareUrl(undefined);
      setCurrentPermission("view"); // ✅ 권한 초기화
    }, []);

    return (
      <>
        <div className="flex items-center space-x-3">
          {/* 공유 버튼 */}
          <button
            onClick={handleShare}
            className="inline-flex items-center px-4 py-2.5 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 shadow-sm"
            disabled={!currentWorkspaceId || !currentCategoryId}
          >
            <Share2 className="w-4 h-4 mr-2" />
            공유
          </button>

          {/* 신규 등록 버튼 */}
          <button
            onClick={onNewItem}
            className="inline-flex items-center px-5 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 active:bg-blue-800 transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4 mr-2" />
            신규 등록
          </button>
        </div>

        <ShareModal
          isOpen={shareModalOpen}
          onClose={handleCloseShareModal}
          onGenerate={handleGenerateShare}
          shareUrl={shareUrl}
          currentPermission={currentPermission} // ✅ 현재 권한 전달
        />
      </>
    );
  }
);

HeaderActions.displayName = "HeaderActions";
