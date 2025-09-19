// src/stores/workspaceStore.ts (단순화)
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useAuthStore } from "./authStore";

export interface Workspace {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
}

interface WorkspaceState {
  currentWorkspace: Workspace | null;
}

interface WorkspaceActions {
  createPersonalWorkspace: (userId: string, userName: string) => void;
  updateWorkspace: (updates: Partial<Workspace>) => void;
  resetWorkspace: () => void;
}

type WorkspaceStore = WorkspaceState & WorkspaceActions;

export const useWorkspaceStore = create<WorkspaceStore>()(
  persist(
    (set, get) => ({
      currentWorkspace: null,

      // 개인 워크스페이스 생성 (로그인한 사용자 기준)
      createPersonalWorkspace: (userId: string, userName: string) => {
        const workspace: Workspace = {
          id: `ws_${userId}`,
          name: `${userName}의 재고관리`,
          ownerId: userId,
          createdAt: new Date().toISOString(),
        };
        set({ currentWorkspace: workspace });
      },

      updateWorkspace: (updates) => {
        const current = get().currentWorkspace;
        if (!current) return;
        set({
          currentWorkspace: { ...current, ...updates },
        });
      },

      resetWorkspace: () => set({ currentWorkspace: null }),
    }),
    {
      name: "workspace-storage",
    }
  )
);
