// src/stores/workspaceStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Workspace {
  id: string;
  name: string;
  description?: string;
  members: Array<{
    userId: string;
    role: "admin" | "member" | "viewer";
  }>;
}

interface WorkspaceState {
  workspaces: Workspace[];
  currentId: string | null;
}

interface WorkspaceActions {
  setWorkspaces: (workspaces: Workspace[]) => void;
  setCurrentId: (id: string | null) => void;
  addWorkspace: (workspace: Workspace) => void;
  removeWorkspace: (id: string) => void;
  can: (workspaceId: string, permission: string) => boolean;
}

type WorkspaceStore = WorkspaceState & WorkspaceActions;

export const useWorkspaceStore = create<WorkspaceStore>()(
  persist(
    (set, get) => ({
      workspaces: [],
      currentId: null,

      setWorkspaces: (workspaces) => set({ workspaces }),

      setCurrentId: (currentId) => set({ currentId }),

      addWorkspace: (workspace) =>
        set((state) => ({
          workspaces: [...state.workspaces, workspace],
        })),

      removeWorkspace: (id) =>
        set((state) => ({
          workspaces: state.workspaces.filter((w) => w.id !== id),
          currentId: state.currentId === id ? null : state.currentId,
        })),

      can: (workspaceId, permission) => {
        // 간단한 권한 체크 로직
        const workspace = get().workspaces.find((w) => w.id === workspaceId);
        return !!workspace; // 임시로 항상 허용
      },
    }),
    {
      name: "workspace-storage",
    }
  )
);
