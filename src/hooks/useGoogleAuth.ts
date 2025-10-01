// src/hooks/useGoogleAuth.ts

import { useState, useCallback } from "react";
import { useAuthStore } from "../stores/authStore";
import { useWorkspaceStore } from "../stores/workspaceStore";
import type { AuthUser } from "../stores/authStore";
import type { UserRole } from "../types/user";

interface GoogleUser {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

export const useGoogleAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuthStore();
  const {
    workspaces,
    createWorkspace,
    setCurrentWorkspaceId,
    claimOwnerIfMissing,
  } = useWorkspaceStore();

  const signInWithGoogle = useCallback(async () => {
    setIsLoading(true);
    try {
      if (!window.google) {
        throw new Error("Google OAuth 라이브러리가 로드되지 않았습니다");
      }

      const response: any = await new Promise((resolve, reject) => {
        window.google.accounts.oauth2
          .initTokenClient({
            client_id: import.meta.env.VITE_INVENTORY_GOOGLE_CLIENT_ID,
            scope: "email profile",
            callback: resolve,
            error_callback: reject,
          })
          .requestAccessToken();
      });

      const userResponse = await fetch(
        `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${response.access_token}`
      );

      if (!userResponse.ok) {
        throw new Error("사용자 정보를 가져올 수 없습니다");
      }

      const googleUser: GoogleUser = await userResponse.json();
      const user: AuthUser = {
        id: googleUser.id,
        email: googleUser.email,
        name: googleUser.name,
        avatarUrl: googleUser.picture,
        role: "staff" as UserRole,
      };
      login(user); // auth-storage에 즉시 저장

      if (workspaces.length === 0) {
        const ws = createWorkspace({
          name: `${user.name.split(" ")[0]}의 워크스페이스`,
          description: "개인 재고 관리",
          type: "DEFAULT",
        } as any);
        setCurrentWorkspaceId(ws.id);
        claimOwnerIfMissing(ws.id, user.id); // ← 안전 보정
      } else {
        const id = workspaces[0].id;
        setCurrentWorkspaceId(id);
        claimOwnerIfMissing(id, user.id); // ← 기존 워크스페이스에도 보정
      }
    } catch (error) {
      console.error("Google 로그인 실패:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [
    login,
    workspaces,
    createWorkspace,
    setCurrentWorkspaceId,
    claimOwnerIfMissing,
  ]);

  return {
    signInWithGoogle,
    isLoading,
  };
};

declare global {
  interface Window {
    google: any;
  }
}
