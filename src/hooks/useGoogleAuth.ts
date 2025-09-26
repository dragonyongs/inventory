// src/hooks/useGoogleAuth.ts

import { useState, useCallback } from "react";
import { useAuthStore } from "../stores/authStore";
import { useWorkspaceStore } from "../stores/workspaceStore";

interface GoogleUser {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

export const useGoogleAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuthStore();
  const { workspaces, createWorkspace, setCurrentWorkspaceId } =
    useWorkspaceStore();

  const createUserWorkspace = useCallback(
    (user: GoogleUser) => {
      const userName = user.name.split(" ")[0];
      const workspaceName = `${userName}의 워크스페이스`;
      const workspace = createWorkspace({
        name: workspaceName,
        description: "개인 재고 관리",
        type: "DEFAULT",
        ownerId: user.id,
        members: [
          {
            userId: user.id,
            email: user.email,
            name: user.name,
            role: "owner",
            joinedAt: new Date().toISOString(),
            invitedBy: user.id,
          },
        ],
        settings: {
          allowMemberInvite: true,
          defaultRole: "member",
        },
      } as any); // <- 타입 단언 추가
      return workspace;
    },
    [createWorkspace]
  );

  const signInWithGoogle = useCallback(async () => {
    setIsLoading(true);

    try {
      // Google OAuth 초기화
      if (!window.google) {
        throw new Error("Google OAuth 라이브러리가 로드되지 않았습니다");
      }

      const response = await new Promise<any>((resolve, reject) => {
        window.google.accounts.oauth2
          .initTokenClient({
            client_id: import.meta.env.VITE_INVENTORY_GOOGLE_CLIENT_ID,
            scope: "email profile",
            callback: resolve,
            error_callback: reject,
          })
          .requestAccessToken();
      });

      // 사용자 정보 가져오기
      const userResponse = await fetch(
        `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${response.access_token}`
      );

      if (!userResponse.ok) {
        throw new Error("사용자 정보를 가져올 수 없습니다");
      }

      const googleUser: GoogleUser = await userResponse.json();

      // 사용자 로그인
      const user = {
        id: googleUser.id,
        email: googleUser.email,
        name: googleUser.name,
        avatar: googleUser.picture,
      };

      login(user);

      // 워크스페이스 확인 및 생성
      if (workspaces.length === 0) {
        createUserWorkspace(googleUser);
      } else {
        // 첫 번째 워크스페이스를 현재 워크스페이스로 설정
        setCurrentWorkspaceId(workspaces[0].id);
      }
    } catch (error) {
      console.error("Google 로그인 실패:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [login, workspaces, createUserWorkspace, setCurrentWorkspaceId]);

  return {
    signInWithGoogle,
    isLoading,
  };
};

// Google OAuth 타입 확장
declare global {
  interface Window {
    google: any;
  }
}
