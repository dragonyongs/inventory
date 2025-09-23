// src/stores/authStore.ts - migration 경고 해결
import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

interface AuthActions {
  login: (user: User) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      // 초기 상태
      user: null,
      isAuthenticated: false,

      // 로그인
      login: (user) => {
        console.log("✅ 사용자 로그인:", user);
        set({
          user,
          isAuthenticated: true,
        });
      },

      // 로그아웃
      logout: () => {
        console.log("👋 사용자 로그아웃");
        set({
          user: null,
          isAuthenticated: false,
        });
      },

      // 사용자 정보 업데이트
      updateUser: (updates) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        }));
      },
    }),
    {
      name: "auth-storage",
      version: 2, // ✅ 버전 증가로 migration 경고 해결
      // ✅ migration 함수 추가
      migrate: (persistedState: any, version: number) => {
        console.log("🔄 AuthStore migration:", { version, persistedState });

        if (version === 0) {
          // 이전 버전에서의 데이터 변환 로직
          return {
            user: persistedState.user || null,
            isAuthenticated: persistedState.isAuthenticated || false,
          };
        }

        // 현재 버전이면 그대로 반환
        return persistedState;
      },
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error("❌ 인증 스토어 복원 실패:", error);
        } else {
          console.log(
            "✅ 인증 스토어 복원 완료:",
            state?.isAuthenticated ? "로그인됨" : "로그아웃"
          );
        }
      },
    }
  )
);
