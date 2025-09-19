// src/hooks/useOnlineSync.ts
import { useEffect } from "react";
import { useWorkspaceStore } from "../stores/workspaceStore";

export const useOnlineSync = () => {
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const currentWorkspaceId = useWorkspaceStore((s) => s.currentWorkspaceId); // currentId → currentWorkspaceId로 수정

  useEffect(() => {
    // 온라인 동기화 로직
    const syncData = async () => {
      if (!currentWorkspaceId || workspaces.length === 0) return;

      try {
        // 실제 API 호출 로직이 들어갈 부분
        console.log("Syncing data for workspace:", currentWorkspaceId);
      } catch (error) {
        console.error("Sync failed:", error);
      }
    };

    // 네트워크 상태 변경 감지
    const handleOnline = () => {
      syncData();
    };

    window.addEventListener("online", handleOnline);

    // 초기 동기화
    if (navigator.onLine) {
      syncData();
    }

    return () => {
      window.removeEventListener("online", handleOnline);
    };
  }, [currentWorkspaceId, workspaces]);
};
