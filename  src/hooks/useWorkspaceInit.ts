// src/hooks/useWorkspaceInit.ts
import { useEffect } from "react";
import { useAuthStore } from "../stores/authStore";
import { useWorkspaceStore } from "../stores/workspaceStore";

export const useWorkspaceInit = () => {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const currentWorkspace = useWorkspaceStore((s) => s.currentWorkspace);
  const createPersonalWorkspace = useWorkspaceStore(
    (s) => s.createPersonalWorkspace
  );

  useEffect(() => {
    // 로그인했지만 워크스페이스가 없으면 개인 워크스페이스 생성
    if (isAuthenticated && user && !currentWorkspace) {
      createPersonalWorkspace(user.id, user.name);
    }
  }, [isAuthenticated, user, currentWorkspace, createPersonalWorkspace]);

  return currentWorkspace;
};
