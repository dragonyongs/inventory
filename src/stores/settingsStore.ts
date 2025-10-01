// src/stores/settingsStore.ts

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type UpdateMode = "auto" | "manual";

interface SettingsState {
  expiringDays: number;
  pageSize: number;
  updateMode: UpdateMode;
  theme: "light" | "dark" | "auto";
  notifications: {
    lowStock: boolean;
    expiringSoon: boolean;
    expired: boolean;
    sound: boolean;
    push: boolean;
    email: boolean;
    quietHours: boolean;
  };
}

interface SettingsActions {
  setExpiringDays: (days: number) => void;
  setPageSize: (size: number) => void;
  setUpdateMode: (mode: UpdateMode) => void;
  setTheme: (theme: "light" | "dark" | "auto") => void;
  setNotifications: (
    notifications: Partial<SettingsState["notifications"]>
  ) => void;
  reset: () => void;
}

type SettingsStore = SettingsState & SettingsActions;

const initialState: SettingsState = {
  expiringDays: 30,
  pageSize: 20,
  updateMode: "auto",
  theme: "auto",
  notifications: {
    lowStock: true,
    expiringSoon: true,
    expired: true,
    sound: true,
    push: false,
    email: false,
    quietHours: false,
  },
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      ...initialState,
      setExpiringDays: (expiringDays: number) => {
        set({ expiringDays });
      },
      setPageSize: (pageSize: number) => {
        set({ pageSize });
      },
      setUpdateMode: (updateMode: UpdateMode) => {
        set({ updateMode });
      },
      setTheme: (theme: "light" | "dark" | "auto") => {
        set({ theme });
      },
      setNotifications: (
        newNotifications: Partial<SettingsState["notifications"]>
      ) => {
        set((state) => ({
          notifications: {
            ...state.notifications,
            ...newNotifications,
          },
        }));
      },
      reset: () => {
        set(initialState);
      },
    }),
    {
      name: "settings-storage",
      version: 2,
      // 이전 버전 스키마 호환
      migrate: (persisted: any) => {
        // v1 -> v2: theme 기본값 추가 등
        const base = { ...initialState, ...persisted };
        if (!base.theme) base.theme = "auto";
        if (!base.notifications)
          base.notifications = initialState.notifications;
        return base as SettingsStore;
      },
      // 불필요한 동적 참조 저장 방지 및 스냅샷 안정성
      partialize: (state) =>
        ({
          expiringDays: state.expiringDays,
          pageSize: state.pageSize,
          updateMode: state.updateMode,
          theme: state.theme,
          notifications: state.notifications,
        } as SettingsState),
    }
  )
);
