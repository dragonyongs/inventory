// src/hooks/useWorkspaceInit.ts

import { useEffect, useState } from "react";
import { useAuthStore } from "../stores/authStore";
import { useWorkspaceStore } from "../stores/workspaceStore";
import { cleanupTempKeys } from "../stores/persistNamespace";

interface UseWorkspaceInitReturn {
  isLoading: boolean;
  isReady: boolean;
  currentWorkspace: any;
  error: string | null;
}

export const useWorkspaceInit = (): UseWorkspaceInitReturn => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  const user = useAuthStore((state) => state.user);
  const {
    workspaces,
    currentWorkspaceId,
    createWorkspace,
    setCurrentWorkspaceId,
    getCurrentWorkspace,
  } = useWorkspaceStore();

  const currentWorkspace = getCurrentWorkspace();

  useEffect(() => {
    // 🔧 개발 모드에서도 forceRefresh 호출하지 않음 (무한 루프 방지)
    console.log("앱 시작 - temp 키만 정리");
    cleanupTempKeys();

    if (!user?.id || initialized) {
      if (!user?.id) setIsLoading(false);
      return;
    }

    const initializeWorkspace = async () => {
      try {
        console.log(`🔧 워크스페이스 초기화 시작`);

        const userWorkspaces = workspaces.filter(
          (ws) =>
            ws.ownerId === user.id ||
            (ws.members && ws.members.some((m) => m.userId === user.id))
        );

        if (userWorkspaces.length === 0) {
          console.log("🆕 기본 워크스페이스 생성 중...");

          const newWorkspace = {
            name: `${user.name}의 재고관리`,
            description: "기본 재고 관리 공간",
            type: "DEFAULT" as const,
            ownerId: user.id,
            members: [
              {
                userId: user.id,
                email: user.email,
                name: user.name,
                role: "owner" as const,
                joinedAt: new Date().toISOString(),
                invitedBy: user.id,
              },
            ],
            settings: {
              allowMemberInvite: true,
              defaultRole: "member" as const,
            },
          };

          const createdWorkspace = createWorkspace(newWorkspace);
          console.log("생성된 워크스페이스:", createdWorkspace);
        } else if (!currentWorkspaceId) {
          console.log("🔄 기존 워크스페이스 선택:", userWorkspaces[0].name);
          setCurrentWorkspaceId(userWorkspaces[0].id);
        }

        setInitialized(true);
        setError(null);
        console.log("🎉 워크스페이스 초기화 완료");
      } catch (err) {
        console.error("❌ 워크스페이스 초기화 오류:", err);
        setError("워크스페이스 초기화 중 오류가 발생했습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    const timer = setTimeout(initializeWorkspace, 300);
    return () => clearTimeout(timer);
  }, [
    user?.id,
    user?.name,
    user?.email,
    JSON.stringify(workspaces),
    currentWorkspaceId,
    createWorkspace,
    setCurrentWorkspaceId,
    initialized,
  ]);

  const isReady = !isLoading && !!currentWorkspace && !!user && initialized;

  return {
    isLoading,
    isReady,
    currentWorkspace,
    error,
  };
};
