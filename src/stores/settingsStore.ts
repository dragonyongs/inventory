import { create } from "zustand";

type UpdateMode = "auto" | "prompt";
type State = { expiringDays: number; pageSize: number; updateMode: UpdateMode };
type Actions = {
  setExpiringDays: (n: number) => void;
  setPageSize: (n: number) => void;
  setUpdateMode: (m: UpdateMode) => void;
};

export const useSettingsStore = create<State & Actions>((set) => ({
  expiringDays: 30,
  pageSize: 20,
  updateMode: "auto",
  setExpiringDays: (n) => set({ expiringDays: n }),
  setPageSize: (n) => set({ pageSize: n }),
  setUpdateMode: (m) => set({ updateMode: m }),
}));
