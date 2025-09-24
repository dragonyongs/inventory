// src/stores/settingsStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type UpdateMode = "auto" | "manual" | "prompt";

interface SettingsState {
  expiringDays: number;
  pageSize: number;
  updateMode: UpdateMode;
  theme: "light" | "dark" | "auto";
  notifications: {
    lowStock: boolean;
    expiry: boolean;
    newMovements: boolean;
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
    expiry: true,
    newMovements: false,
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
      version: 1,
    }
  )
);
