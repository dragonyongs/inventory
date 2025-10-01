import { create } from "zustand";
import type { ActivityLog } from "../types/activity";

interface ActivityState {
  activities: ActivityLog[];
  filters: {
    userId: string | null;
    movementType: string | null;
    dateRange: { start: string | null; end: string | null };
    searchText: string;
  };
  addActivity: (activity: ActivityLog) => void;
  updateActivity: (id: string, updated: Partial<ActivityLog>) => void;
  removeActivity: (id: string) => void;
  setFilters: (filters: Partial<ActivityState["filters"]>) => void;
  clearFilters: () => void;
}

export const useActivityStore = create<ActivityState>((set) => ({
  activities: [],
  filters: {
    userId: null,
    movementType: null,
    dateRange: { start: null, end: null },
    searchText: "",
  },

  addActivity: (activity) =>
    set((state) => ({ activities: [activity, ...state.activities] })),

  updateActivity: (id, updated) =>
    set((state) => ({
      activities: state.activities.map((a) =>
        a.id === id ? { ...a, ...updated } : a
      ),
    })),

  removeActivity: (id) =>
    set((state) => ({
      activities: state.activities.filter((a) => a.id !== id),
    })),

  setFilters: (filters) =>
    set((state) => ({
      filters: { ...state.filters, ...filters },
    })),

  clearFilters: () =>
    set(() => ({
      filters: {
        userId: null,
        movementType: null,
        dateRange: { start: null, end: null },
        searchText: "",
      },
    })),
}));
