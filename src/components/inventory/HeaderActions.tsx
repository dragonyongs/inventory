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
    const [shareUrl, setShareUrl] = useState<string | undefined>();
    const [currentPermission, setCurrentPermission] =
      useState<SharePermission>("view");

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
      setCurrentPermission("view");
    }, []);

    return (
      <>
        {/* 모바일: 전체 너비 그리드, 데스크탑: 플렉스 */}
        <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-3">
          {/* 공유 버튼 */}
          <button
            onClick={handleShare}
            className="inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 sm:py-2 
                     text-sm font-medium text-gray-700 bg-white border border-gray-300 
                     rounded-lg hover:bg-gray-50 transition-colors duration-200
                     focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                     active:bg-gray-100 touch-manipulation"
          >
            <Share2 className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">공유</span>
          </button>

          {/* 신규 등록 버튼 */}
          <button
            onClick={onNewItem}
            className="inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 sm:py-2 
                     text-sm font-medium text-white bg-blue-600 border border-transparent 
                     rounded-lg hover:bg-blue-700 transition-colors duration-200
                     focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                     active:bg-blue-800 touch-manipulation shadow-sm"
          >
            <Plus className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">신규 등록</span>
          </button>
        </div>

        <ShareModal
          isOpen={shareModalOpen}
          onClose={handleCloseShareModal}
          onGenerate={handleGenerateShare}
          shareUrl={shareUrl}
          currentPermission={currentPermission}
        />
      </>
    );
  }
);

HeaderActions.displayName = "HeaderActions";
