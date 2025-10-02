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
      useState<SharePermission>("view");

    // ✅ 개선: "전체"도 공유 가능하도록 수정
    const handleShare = useCallback(() => {
      if (!currentWorkspaceId) {
        alert("워크스페이스를 먼저 선택해주세요.");
        return;
      }

      setShareModalOpen(true);
    }, [currentWorkspaceId]);

    // ✅ 개선: "전체" 선택 시에도 공유 URL 생성
    const handleGenerateShare = useCallback(
      (permission: SharePermission) => {
        if (!currentWorkspaceId) return;

        const baseUrl = window.location.origin;
        let url: string;

        if (currentCategoryId === null) {
          // "전체" 카테고리인 경우: 워크스페이스 전체 공유
          url = `${baseUrl}/share/workspace/${currentWorkspaceId}?permission=${permission}`;
        } else {
          // 특정 카테고리 공유
          const token = generateShareToken(currentCategoryId);
          url = `${baseUrl}/share/${token}?permission=${permission}&workspace=${currentWorkspaceId}&category=${currentCategoryId}`;
        }

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
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
          {/* 공유 버튼 */}
          <button
            onClick={handleShare}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg
              bg-white hover:bg-gray-50 border border-gray-200 text-gray-700
              transition-colors duration-200 text-sm font-medium shadow-sm"
          >
            <Share2 size={18} />
            <span>공유</span>
          </button>

          {/* 신규 등록 버튼 */}
          <button
            onClick={onNewItem}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg
              bg-gray-900 hover:bg-gray-800 text-white
              transition-colors duration-200 text-sm font-medium shadow-sm"
          >
            <Plus size={18} />
            <span>신규 등록</span>
          </button>
        </div>

        {/* ✅ 수정: prop 이름을 onGenerate로 변경 */}
        <ShareModal
          isOpen={shareModalOpen}
          onClose={handleCloseShareModal}
          onGenerate={handleGenerateShare}
          shareUrl={shareUrl}
          currentPermission={currentPermission}
          shareContext={
            currentCategoryId === null ? "워크스페이스 전체" : "현재 카테고리"
          }
        />
      </>
    );
  }
);

HeaderActions.displayName = "HeaderActions";
