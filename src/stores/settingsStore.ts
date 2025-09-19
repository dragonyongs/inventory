// src/stores/settingsStore.ts (완전 수정 버전)

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type UpdateMode = "auto" | "manual" | "prompt";

interface SettingsState {
  expiringDays: number;
  pageSize: number;
  updateMode: UpdateMode;
}

interface SettingsActions {
  setExpiringDays: (days: number) => void;
  setPageSize: (size: number) => void;
  setUpdateMode: (mode: UpdateMode) => void;
  reset: () => void;
}

type SettingsStore = SettingsState & SettingsActions;

const initialState: SettingsState = {
  expiringDays: 30,
  pageSize: 20,
  updateMode: "auto",
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      ...initialState,

      setExpiringDays: (expiringDays) => set({ expiringDays }),
      setPageSize: (pageSize) => set({ pageSize }),
      setUpdateMode: (updateMode) => set({ updateMode }),
      reset: () => set(initialState),
    }),
    {
      name: "settings-storage",
    }
  )
);
