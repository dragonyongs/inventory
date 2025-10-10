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
  ownerId: string;
}

export type WorkspaceRole = "owner" | "admin" | "member" | "viewer";

export interface WorkspacePermissions {
  canEditWorkspace: boolean;
  canDeleteWorkspace: boolean;
  canInviteMembers: boolean;
  canRemoveMembers: boolean;
  canChangePermissions: boolean;
  canManageItems: boolean;
  canViewItems: boolean;
  canEditItems: boolean;
  canDeleteItems: boolean;
}

interface WorkspaceMembersState {
  // ✅ 수정: Record 타입 인자 2개로 변경
  memberships: Record<string, Record<string, WorkspaceRole>>;
  customPermissions: Record<
    string,
    Record<string, Partial<WorkspacePermissions>>
  >;
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
  updateWorkspace: (id: string, data: Partial<Omit<Workspace, "id">>) => void;
  deleteWorkspace: (id: string) => void;
  switchWorkspace: (id: string) => void;
  setCurrentWorkspaceId: (id: string | null) => void;
  getCurrentWorkspace: () => Workspace | null;
  getWorkspaceById: (id: string) => Workspace | undefined;
  ensureDefaultWorkspace: () => void;
  initialize: () => void;

  getUserRole: (workspaceId: string, userId: string) => WorkspaceRole | null;
  setUserRole: (
    workspaceId: string,
    userId: string,
    role: WorkspaceRole
  ) => void;
  removeUserFromWorkspace: (workspaceId: string, userId: string) => void;
  claimOwnerIfMissing: (workspaceId: string, userId: string) => void;
  ensureMembershipForCurrentUser: (workspaceId: string) => void;

  getWorkspaceMembers: (
    workspaceId: string
  ) => Array<{ userId: string; role: WorkspaceRole }>;
  getUserPermissions: (
    workspaceId: string,
    userId: string
  ) => WorkspacePermissions;
  setCustomPermissions: (
    workspaceId: string,
    userId: string,
    permissions: Partial<WorkspacePermissions>
  ) => void;
  getOwnedWorkspaces: (userId: string) => Workspace[];
  getSharedWorkspaces: (userId: string) => Workspace[];
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

function getDefaultPermissions(role: WorkspaceRole): WorkspacePermissions {
  switch (role) {
    case "owner":
      return {
        canEditWorkspace: true,
        canDeleteWorkspace: true,
        canInviteMembers: true,
        canRemoveMembers: true,
        canChangePermissions: true,
        canManageItems: true,
        canViewItems: true,
        canEditItems: true,
        canDeleteItems: true,
      };
    case "admin":
      return {
        canEditWorkspace: false,
        canDeleteWorkspace: false,
        canInviteMembers: true,
        canRemoveMembers: true,
        canChangePermissions: false,
        canManageItems: true,
        canViewItems: true,
        canEditItems: true,
        canDeleteItems: true,
      };
    case "member":
      return {
        canEditWorkspace: false,
        canDeleteWorkspace: false,
        canInviteMembers: false,
        canRemoveMembers: false,
        canChangePermissions: false,
        canManageItems: true,
        canViewItems: true,
        canEditItems: true,
        canDeleteItems: false,
      };
    case "viewer":
      return {
        canEditWorkspace: false,
        canDeleteWorkspace: false,
        canInviteMembers: false,
        canRemoveMembers: false,
        canChangePermissions: false,
        canManageItems: false,
        canViewItems: true,
        canEditItems: false,
        canDeleteItems: false,
      };
  }
}

export const useWorkspaceStore = create<WorkspaceStore>()(
  persist(
    (set, get) => ({
      workspaces: [],
      currentWorkspaceId: null,
      isInitialized: false,
      memberships: {},
      customPermissions: {},

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

      ensureMembershipForCurrentUser: (workspaceId: string) => {
        const userId = tryGetAuthUserId();
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

      createWorkspace: (data) => {
        const userId = tryGetAuthUserId();
        if (!userId) {
          console.error("❌ 사용자 ID를 찾을 수 없습니다.");
          throw new Error("로그인이 필요합니다.");
        }

        const w: Workspace = {
          id: newId(),
          name: data.name,
          description: data.description,
          type: data.type,
          createdAt: nowIso(),
          updatedAt: nowIso(),
          ownerId: userId,
        };

        set((s) => ({
          workspaces: [...s.workspaces, w],
          currentWorkspaceId: w.id,
          memberships: {
            ...s.memberships,
            [w.id]: {
              ...(s.memberships[w.id] ?? {}),
              [userId]: "owner",
            },
          },
        }));

        console.log("✅ 워크스페이스 생성 완료:", w);
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
          const customPermissions = { ...s.customPermissions };
          delete memberships[id];
          delete customPermissions[id];

          const currentWorkspaceId =
            s.currentWorkspaceId === id
              ? filtered[0]?.id ?? null
              : s.currentWorkspaceId;

          return {
            workspaces: filtered,
            currentWorkspaceId,
            memberships,
            customPermissions,
          };
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

      getWorkspaceById: (id: string) => {
        return get().workspaces.find((w) => w.id === id);
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
            ownerId: userId || "unknown",
          };

          set({
            workspaces: [w],
            currentWorkspaceId: w.id,
            memberships: {
              ...(s.memberships ?? {}),
              [w.id]: {
                ...(s.memberships?.[w.id] ?? {}),
                ...(userId ? { [userId]: "owner" } : {}),
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

      removeUserFromWorkspace: (workspaceId, userId) => {
        set((s) => {
          const wsMembers = { ...(s.memberships[workspaceId] ?? {}) };
          delete wsMembers[userId];

          const wsPermissions = { ...(s.customPermissions[workspaceId] ?? {}) };
          delete wsPermissions[userId];

          return {
            memberships: {
              ...s.memberships,
              [workspaceId]: wsMembers,
            },
            customPermissions: {
              ...s.customPermissions,
              [workspaceId]: wsPermissions,
            },
          };
        });
      },

      // ✅ 수정: role을 WorkspaceRole로 명시적 타입 캐스팅
      getWorkspaceMembers: (workspaceId) => {
        const members = get().memberships[workspaceId] ?? {};
        return Object.entries(members).map(([userId, role]) => ({
          userId,
          role: role as WorkspaceRole,
        }));
      },

      getUserPermissions: (workspaceId, userId) => {
        const role = get().getUserRole(workspaceId, userId);
        if (!role) return getDefaultPermissions("viewer");

        const defaultPerms = getDefaultPermissions(role);
        const customPerms =
          get().customPermissions[workspaceId]?.[userId] ?? {};

        return { ...defaultPerms, ...customPerms };
      },

      setCustomPermissions: (workspaceId, userId, permissions) => {
        set((s) => ({
          customPermissions: {
            ...s.customPermissions,
            [workspaceId]: {
              ...(s.customPermissions[workspaceId] ?? {}),
              [userId]: {
                ...(s.customPermissions[workspaceId]?.[userId] ?? {}),
                ...permissions,
              },
            },
          },
        }));
      },

      getOwnedWorkspaces: (userId) => {
        return get().workspaces.filter((ws) => ws.ownerId === userId);
      },

      getSharedWorkspaces: (userId) => {
        const { workspaces, memberships } = get();
        return workspaces.filter((ws) => {
          const role = memberships[ws.id]?.[userId];
          return role && ws.ownerId !== userId;
        });
      },
    }),
    {
      name: "inventory-workspaces",
      version: 2,
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
