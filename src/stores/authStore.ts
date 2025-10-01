// src/stores/authStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UserRole } from "../types/user";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  role: UserRole;
}

interface AuthState {
  user: AuthUser | null;
  setUser: (user: AuthUser) => void;
  clearUser: () => void;
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
      setUser: (user) => set({ user }),
      clearUser: () => set({ user: null }),
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
      version: 3,
      // 이전 구조 → 현재 구조로의 안전한 마이그레이션
      migrate: (persisted: any, fromVersion: number) => {
        console.log("🔄 AuthStore migrate", { fromVersion, persisted });
        if (!persisted || typeof persisted !== "object") {
          return { user: null, isAuthenticated: false };
        }
        const user = persisted.user
          ? { ...persisted.user, role: persisted.user.role || "staff" }
          : null;
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
