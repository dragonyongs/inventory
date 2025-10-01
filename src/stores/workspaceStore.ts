// src/stores/workspaceStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type WorkspaceType =
  | "DEFAULT"
  | "RETAIL"
  | "WAREHOUSE"
  | "RESTAURANT"
  | "PHARMACY"
  | "EVENT"
  | "OFFICE"
  | "GENERAL";

export interface Workspace {
  id: string;
  name: string;
  description?: string;
  type: WorkspaceType;
  createdAt: string;
  updatedAt: string;
}

// 권한/멤버십
export type WorkspaceRole = "owner" | "admin" | "member" | "viewer";

interface WorkspaceMembersState {
  // workspaceId -> { userId -> role }
  memberships: Record<string, Record<string, WorkspaceRole>>;
}

interface WorkspaceState {
  workspaces: Workspace[];
  currentWorkspaceId: string | null;
  isInitialized: boolean;
}

interface WorkspaceActions {
  createWorkspace: (data: {
    name: string;
    description?: string;
    type: WorkspaceType;
  }) => Workspace;
  updateWorkspace: (
    id: string,
    data: Partial<Pick<Workspace, "name" | "description" | "type">>
  ) => void;
  deleteWorkspace: (id: string) => void;
  switchWorkspace: (id: string) => void;
  setCurrentWorkspaceId: (id: string | null) => void;
  getCurrentWorkspace: () => Workspace | null;
  ensureDefaultWorkspace: () => void;
  initialize: () => void;

  // 멤버십 관련
  getUserRole: (workspaceId: string, userId: string) => WorkspaceRole | null;
  setUserRole: (
    workspaceId: string,
    userId: string,
    role: WorkspaceRole
  ) => void;
  claimOwnerIfMissing: (workspaceId: string, userId: string) => void;
  ensureMembershipForCurrentUser: (workspaceId: string) => void;
}

export type WorkspaceStore = WorkspaceState &
  WorkspaceMembersState &
  WorkspaceActions;

function newId() {
  return Math.random().toString(36).slice(2, 10);
}

function nowIso() {
  return new Date().toISOString();
}

// auth-store persist에서 userId를 가져오는 임시 유틸 (DB 도입 전까지만 사용)
function tryGetAuthUserId(): string | null {
  try {
    const raw = localStorage.getItem("auth-storage");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed.state?.user?.id ?? null;
  } catch {
    return null;
  }
}

export const useWorkspaceStore = create<WorkspaceStore>()(
  persist(
    (set, get) => ({
      // 초기 상태
      workspaces: [],
      currentWorkspaceId: null,
      isInitialized: false,
      memberships: {},

      claimOwnerIfMissing: (workspaceId: string, userId: string) => {
        const s = get();
        const wsMembers = s.memberships[workspaceId] ?? {};
        const hasAny = Object.keys(wsMembers).length > 0;
        const already = wsMembers[userId];

        if (!hasAny || !already) {
          set((st) => ({
            memberships: {
              ...st.memberships,
              [workspaceId]: {
                ...(st.memberships[workspaceId] ?? {}),
                [userId]: "owner",
              },
            },
          }));
        }
      },

      // 현재 사용자 ID를 auth-storage에서 얻는 내부 유틸 (기존 tryGetAuthUserId 사용)
      ensureMembershipForCurrentUser: (workspaceId: string) => {
        const userId = (() => {
          try {
            const raw = localStorage.getItem("auth-storage");
            return raw ? JSON.parse(raw).state?.user?.id ?? null : null;
          } catch {
            return null;
          }
        })();
        if (!userId) return;

        const role = get().memberships[workspaceId]?.[userId];
        if (!role) {
          set((s) => ({
            memberships: {
              ...s.memberships,
              [workspaceId]: {
                ...(s.memberships[workspaceId] ?? {}),
                [userId]: "owner",
              },
            },
          }));
        }
      },

      // 워크스페이스 생성
      createWorkspace: (data) => {
        const w: Workspace = {
          id: newId(),
          name: data.name,
          description: data.description,
          type: data.type,
          createdAt: nowIso(),
          updatedAt: nowIso(),
        };
        const userId = tryGetAuthUserId();
        set((s) => ({
          workspaces: [...s.workspaces, w],
          currentWorkspaceId: w.id,
          memberships: {
            ...s.memberships,
            [w.id]: {
              ...(s.memberships[w.id] ?? {}),
              ...(userId ? { [userId]: "owner" as const } : {}),
            },
          },
        }));
        // queueMicrotask(() =>
        //   window.dispatchEvent(
        //     new CustomEvent("workspace-changed", {
        //       detail: { workspaceId: w.id },
        //     })
        //   )
        // );
        queueMicrotask(() => get().ensureMembershipForCurrentUser(w.id));
        return w;
      },

      updateWorkspace: (id, data) => {
        set((s) => ({
          workspaces: s.workspaces.map((w) =>
            w.id === id ? { ...w, ...data, updatedAt: nowIso() } : w
          ),
        }));
      },

      deleteWorkspace: (id) => {
        set((s) => {
          const filtered = s.workspaces.filter((w) => w.id !== id);
          const memberships = { ...s.memberships };
          delete memberships[id];
          const currentWorkspaceId =
            s.currentWorkspaceId === id
              ? filtered[0]?.id ?? null
              : s.currentWorkspaceId;
          return { workspaces: filtered, currentWorkspaceId, memberships };
        });
      },

      switchWorkspace: (id) => {
        const exists = get().workspaces.some((w) => w.id === id);
        if (!exists) return;
        set({ currentWorkspaceId: id });
        queueMicrotask(() =>
          window.dispatchEvent(
            new CustomEvent("workspace-changed", {
              detail: { workspaceId: id },
            })
          )
        );
      },

      setCurrentWorkspaceId: (id) => set({ currentWorkspaceId: id }),

      getCurrentWorkspace: () => {
        const s = get();
        return s.workspaces.find((w) => w.id === s.currentWorkspaceId) ?? null;
      },

      ensureDefaultWorkspace: () => {
        const s = get();
        if (s.workspaces.length === 0) {
          const userId = tryGetAuthUserId();
          const w: Workspace = {
            id: newId(),
            name: "My Workspace",
            type: "DEFAULT",
            createdAt: nowIso(),
            updatedAt: nowIso(),
          };
          set({
            workspaces: [w],
            currentWorkspaceId: w.id,
            memberships: {
              ...(s.memberships ?? {}),
              [w.id]: {
                ...(s.memberships?.[w.id] ?? {}),
                ...(userId ? { [userId]: "owner" as const } : {}),
              },
            },
          });
        } else if (!s.currentWorkspaceId) {
          set({ currentWorkspaceId: s.workspaces[0].id });
        }
      },

      initialize: () => {
        const s = get();
        if (s.isInitialized) return;
        get().ensureDefaultWorkspace();
        set({ isInitialized: true });
      },

      // 멤버십
      getUserRole: (workspaceId, userId) => {
        const { memberships } = get();
        return memberships[workspaceId]?.[userId] ?? null;
      },

      setUserRole: (workspaceId, userId, role) => {
        set((s) => ({
          memberships: {
            ...s.memberships,
            [workspaceId]: {
              ...(s.memberships[workspaceId] ?? {}),
              [userId]: role,
            },
          },
        }));
      },
    }),
    {
      name: "inventory-workspaces",
      version: 1,
      onRehydrateStorage: () => (state) => {
        if (state && !state.isInitialized) {
          setTimeout(() => {
            if (!state.isInitialized) state.initialize();
          }, 0);
        }
      },
    }
  )
);
