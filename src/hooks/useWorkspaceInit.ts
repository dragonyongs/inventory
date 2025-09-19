// src/hooks/useWorkspaceInit.ts
import { useEffect, useState } from "react";
import { useAuthStore } from "../stores/authStore";
import { useWorkspaceStore } from "../stores/workspaceStore";

export const useWorkspaceInit = () => {
  const [isLoading, setIsLoading] = useState(true);
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const currentId = useWorkspaceStore((s) => s.currentId);
  const createWorkspace = useWorkspaceStore((s) => s.createWorkspace);
  const setCurrentId = useWorkspaceStore((s) => s.setCurrentId);

  useEffect(() => {
    const initWorkspace = async () => {
      if (!isAuthenticated || !user) {
        setIsLoading(false);
        return;
      }

      try {
        // 기존 워크스페이스가 없거나, currentId가 유효하지 않으면
        if (workspaces.length === 0) {
          // 첫 워크스페이스 생성
          const newWorkspace = createWorkspace(
            `${user.name}의 재고관리`,
            "개인 재고관리 워크스페이스"
          );
          console.log("Created initial workspace:", newWorkspace);
        } else if (
          !currentId ||
          !workspaces.find((ws) => ws.id === currentId)
        ) {
          // 유효하지 않은 currentId면 첫 번째 워크스페이스로 설정
          setCurrentId(workspaces[0].id);
        }
      } catch (error) {
        console.error("Failed to initialize workspace:", error);
      } finally {
        // 로딩 완료
        setTimeout(() => setIsLoading(false), 500); // 약간의 지연으로 부드러운 전환
      }
    };

    initWorkspace();
  }, [
    isAuthenticated,
    user,
    workspaces,
    currentId,
    createWorkspace,
    setCurrentId,
  ]);

  return {
    isLoading,
    isReady:
      !isLoading && isAuthenticated && currentId && workspaces.length > 0,
    currentWorkspace: workspaces.find((ws) => ws.id === currentId) || null,
  };
};
