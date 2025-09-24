// src/hooks/useWorkspaceInit.ts
import { useEffect, useMemo, useState } from "react";
import { useAuthStore } from "@/stores/authStore";
import {
  useWorkspaceStore,
  type Workspace,
  type WorkspaceRole,
} from "@/stores/workspaceStore";
import { cleanupTempKeys } from "@/utils/persistNamespace";

interface UseWorkspaceInitReturn {
  isLoading: boolean;
  isReady: boolean;
  currentWorkspace: Workspace | null;
  error: string | null;
  needsWorkspaceSetup?: boolean;
}

export const useWorkspaceInit = (): UseWorkspaceInitReturn => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  const user = useAuthStore((s) => s.user);

  const {
    workspaces,
    currentWorkspaceId,
    createWorkspace,
    setCurrentWorkspaceId,
    getCurrentWorkspace,
    // memberships와 역할 리졸버 사용
    getUserRole,
  } = useWorkspaceStore();

  const currentWorkspace = getCurrentWorkspace();

  // 사용자 소속 워크스페이스: memberships 기반으로 계산
  const userWorkspaces = useMemo(() => {
    if (!user?.id) return [] as Workspace[];
    return workspaces.filter((ws) => {
      const role = getUserRole(ws.id, user.id) as WorkspaceRole | null;
      return role !== null; // viewer 이상이면 포함
    });
  }, [workspaces, user?.id, getUserRole]);

  useEffect(() => {
    console.log("앱 시작 - temp 키만 정리");
    cleanupTempKeys();
  }, []);

  useEffect(() => {
    if (!user?.id || initialized) {
      if (!user?.id) setIsLoading(false);
      return;
    }

    const initializeWorkspace = async () => {
      try {
        console.log("🔧 워크스페이스 초기화 시작");
        if (userWorkspaces.length === 0) {
          console.log("🆕 기본 워크스페이스 생성 중...");
          // 스토어 시그니처에 맞는 최소 필드만 전달
          const created = createWorkspace({
            name: `${user.name ?? user.email ?? "나"}의 재고관리`,
            description: "기본 재고 관리 공간",
            type: "DEFAULT",
          });
          console.log("생성된 워크스페이스:", created);
          // createWorkspace 내부에서 현재 사용자에게 owner를 부여하도록 스토어가 구현되어 있음
          // 필요 시 setCurrentWorkspaceId(created.id) 호출
          setCurrentWorkspaceId(created.id);
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

    const timer = setTimeout(initializeWorkspace, 200);
    return () => clearTimeout(timer);
  }, [
    user?.id,
    user?.name,
    user?.email,
    userWorkspaces.length,
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
    needsWorkspaceSetup:
      userWorkspaces.length === 0 && !isLoading && !!user?.id,
  };
};
