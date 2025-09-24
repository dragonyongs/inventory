// src/stores/authStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
}

interface AuthActions {
  login: (u: AuthUser) => void;
  logout: () => void;
  updateProfile: (patch: Partial<AuthUser>) => void;
}

export type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,

      login: (u) => {
        console.log("✅ 사용자 로그인:", u);
        set({ user: u, isAuthenticated: true });
      },

      logout: () => {
        console.log("👋 사용자 로그아웃");
        set({ user: null, isAuthenticated: false });
      },

      updateProfile: (patch) => {
        const cur = get().user;
        if (!cur) return;
        set({ user: { ...cur, ...patch } });
      },
    }),
    {
      name: "auth-storage",
      version: 2,
      // 이전 구조 → 현재 구조로의 안전한 마이그레이션
      migrate: (persisted: any, fromVersion: number) => {
        console.log("🔄 AuthStore migrate", { fromVersion, persisted });
        if (!persisted || typeof persisted !== "object") {
          return { user: null, isAuthenticated: false };
        }
        // v1 형태 호환 처리
        const user = persisted.user ?? null;
        const isAuthenticated = Boolean(persisted.isAuthenticated && user);
        return { user, isAuthenticated };
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
