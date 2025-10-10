// src/hooks/useWorkspaceInit.ts

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import {
  useWorkspaceStore,
  type Workspace,
  type WorkspaceRole,
} from "@/stores/workspaceStore";
import { cleanupTempKeys } from "@/utils/persistNamespace";

// ✅ 올바른 UTF-8 Base64 디코딩 함수
function decodeBase64(str: string): string {
  try {
    // Base64 디코딩 후 decodeURIComponent로 UTF-8 복원
    return decodeURIComponent(
      atob(str)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
  } catch (e) {
    console.error("Base64 디코딩 실패:", e);
    throw e;
  }
}

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
  const [searchParams, setSearchParams] = useSearchParams();

  const user = useAuthStore((s) => s.user);
  const {
    workspaces,
    currentWorkspaceId,
    createWorkspace,
    setCurrentWorkspaceId,
    getCurrentWorkspace,
    getUserRole,
    setUserRole,
  } = useWorkspaceStore();

  const currentWorkspace = getCurrentWorkspace();

  const userWorkspaces = useMemo(() => {
    if (!user?.id) return [] as Workspace[];
    return workspaces.filter((ws) => {
      const role = getUserRole(ws.id, user.id) as WorkspaceRole | null;
      return role !== null;
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

        // ✅ 1. URL에서 초대 정보 확인 (최우선)
        const inviteParam = searchParams.get("invite");

        if (inviteParam) {
          try {
            // UTF-8 안전 Base64 디코딩
            const decodedString = decodeBase64(inviteParam);
            const inviteData = JSON.parse(decodedString);
            console.log("📧 초대 감지:", inviteData);

            const { wsId, wsName, role, inviter } = inviteData;

            // 워크스페이스가 이미 존재하는지 확인
            const existingWorkspace = workspaces.find((ws) => ws.id === wsId);

            if (existingWorkspace) {
              // 기존 워크스페이스에 멤버로 추가
              setUserRole(wsId, user.id, role);
              setCurrentWorkspaceId(wsId);
              console.log("✅ 기존 워크스페이스 참여:", wsName);
            } else {
              // 워크스페이스 생성 (서버 없는 임시 방편)
              const newWorkspace = createWorkspace({
                name: wsName,
                description: `${inviter}님이 초대한 워크스페이스`,
                type: "DEFAULT",
              });

              setUserRole(newWorkspace.id, user.id, role);
              setCurrentWorkspaceId(newWorkspace.id);
              console.log("🆕 초대된 워크스페이스 생성:", wsName);
            }

            // URL 파라미터 제거
            setSearchParams({});

            setInitialized(true);
            setError(null);
            setIsLoading(false);

            alert(`✅ ${wsName}에 참여했습니다!`);
            console.log("🎉 초대 수락 완료");
            return;
          } catch (e) {
            console.error("❌ 초대 파라미터 파싱 실패:", e);
            setSearchParams({});
          }
        }

        // ✅ 2. 초대가 없으면: 기존 워크스페이스 확인
        if (userWorkspaces.length > 0) {
          if (!currentWorkspaceId) {
            console.log("🔄 기존 워크스페이스 선택:", userWorkspaces[0].name);
            setCurrentWorkspaceId(userWorkspaces[0].id);
          }
          console.log("✅ 기존 워크스페이스 사용:", userWorkspaces.length);
        } else {
          // ✅ 3. 워크스페이스가 없으면 신규 생성
          console.log("🆕 기본 워크스페이스 생성 중...");
          const created = createWorkspace({
            name: `${user.name ?? user.email ?? "나"}의 재고관리`,
            description: "기본 재고 관리 공간",
            type: "DEFAULT",
          });
          console.log("생성된 워크스페이스:", created);
          setCurrentWorkspaceId(created.id);
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
    searchParams,
    setSearchParams,
    getUserRole,
    setUserRole,
    workspaces,
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
