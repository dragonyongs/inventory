// src/hooks/useWorkspaceSync.ts

import { useEffect, useRef } from "react";
import { useWorkspaceStore } from "../stores/workspaceStore";
import { useAuthStore } from "../stores/authStore";

export const useWorkspaceSync = () => {
  const currentWorkspaceId = useWorkspaceStore((s) => s.currentWorkspaceId);
  const user = useAuthStore((s) => s.user);
  const prevWorkspaceId = useRef<string | null>(null);

  useEffect(() => {
    if (!user?.id || !currentWorkspaceId) return;

    // 워크스페이스 변경 감지
    if (
      prevWorkspaceId.current &&
      prevWorkspaceId.current !== currentWorkspaceId
    ) {
      console.log(
        `🔄 워크스페이스 변경 감지: ${prevWorkspaceId.current} → ${currentWorkspaceId}`
      );

      // 🔧 새로고침 대신 이벤트만 발생
      window.dispatchEvent(
        new CustomEvent("workspace-changed", {
          detail: {
            oldWorkspaceId: prevWorkspaceId.current,
            newWorkspaceId: currentWorkspaceId,
          },
        })
      );
    }

    prevWorkspaceId.current = currentWorkspaceId;
  }, [currentWorkspaceId, user?.id]);
};
