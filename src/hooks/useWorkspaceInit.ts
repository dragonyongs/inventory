// src/hooks/useWorkspaceInit.ts
import { useEffect, useState, useCallback } from "react";
import { useAuthStore } from "../stores/authStore";
import { useWorkspaceStore } from "../stores/workspaceStore";

export const useWorkspaceInit = () => {
  const [isLoading, setIsLoading] = useState(true);
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const currentWorkspaceId = useWorkspaceStore((s) => s.currentWorkspaceId);
  const createWorkspace = useWorkspaceStore((s) => s.createWorkspace);
  const setCurrentWorkspaceId = useWorkspaceStore(
    (s) => s.setCurrentWorkspaceId
  );

  const initWorkspace = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setIsLoading(false);
      return;
    }

    try {
      // 기존 워크스페이스가 없는 경우 생성
      if (workspaces.length === 0) {
        const newWorkspace = createWorkspace(
          `${user.name}의 재고관리`,
          "개인 재고관리 워크스페이스"
        );
        console.log("Created initial workspace:", newWorkspace);
        return;
      }

      // 현재 선택된 워크스페이스가 없거나 유효하지 않은 경우
      if (
        !currentWorkspaceId ||
        !workspaces.find((ws) => ws.id === currentWorkspaceId)
      ) {
        // 첫 번째 워크스페이스로 설정
        setCurrentWorkspaceId(workspaces[0].id);
      }
    } catch (error) {
      console.error("Failed to initialize workspace:", error);
    } finally {
      setTimeout(() => setIsLoading(false), 100);
    }
  }, [
    isAuthenticated,
    user,
    workspaces,
    currentWorkspaceId,
    createWorkspace,
    setCurrentWorkspaceId,
  ]);

  useEffect(() => {
    initWorkspace();
  }, [initWorkspace]);

  const currentWorkspace = workspaces.find(
    (ws) => ws.id === currentWorkspaceId
  );

  return {
    isLoading,
    isReady:
      !isLoading &&
      isAuthenticated &&
      !!currentWorkspaceId &&
      workspaces.length > 0,
    currentWorkspace: currentWorkspace || null,
    hasWorkspace: workspaces.length > 0,
    needsWorkspaceSetup:
      !isLoading && isAuthenticated && workspaces.length === 0,
  };
};
