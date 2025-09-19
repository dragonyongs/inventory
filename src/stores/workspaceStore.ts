// src/stores/workspaceStore.ts

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Workspace {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  members: Array<{
    userId: string;
    email: string;
    name: string;
    role: "owner" | "admin" | "member" | "viewer";
    joinedAt: string;
    invitedBy: string;
  }>;
  settings: {
    allowMemberInvite: boolean;
    defaultRole: "member" | "viewer";
  };
}

interface WorkspaceState {
  workspaces: Workspace[];
  currentWorkspaceId: string | null; // ✅ currentId → currentWorkspaceId로 수정
  pendingInvites: Array<{
    id: string;
    workspaceId: string;
    email: string;
    role: "admin" | "member" | "viewer";
    invitedBy: string;
    createdAt: string;
    expiresAt: string;
  }>;
  // ✅ 하위 호환성을 위한 computed property 추가
  get currentId(): string | null;
}

interface WorkspaceActions {
  // 기본 워크스페이스 관리
  setWorkspaces: (workspaces: Workspace[]) => void;
  setCurrentWorkspaceId: (id: string | null) => void;
  // ✅ 하위 호환성을 위한 별칭 추가
  setCurrentId: (id: string | null) => void;
  createWorkspace: (name: string, description?: string) => Workspace;
  updateWorkspace: (id: string, updates: Partial<Workspace>) => void;
  deleteWorkspace: (id: string) => void;

  // 멤버 관리
  inviteMember: (
    workspaceId: string,
    email: string,
    role: "admin" | "member" | "viewer"
  ) => void;
  acceptInvite: (inviteId: string) => void;
  removeMember: (workspaceId: string, userId: string) => void;
  updateMemberRole: (
    workspaceId: string,
    userId: string,
    role: "admin" | "member" | "viewer"
  ) => void;

  // 권한 체크
  canInviteMembers: (workspaceId: string) => boolean;
  canRemoveMembers: (workspaceId: string) => boolean;
  getUserRole: (
    workspaceId: string,
    userId: string
  ) => "owner" | "admin" | "member" | "viewer" | null;
}

type WorkspaceStore = WorkspaceState & WorkspaceActions;

export const useWorkspaceStore = create<WorkspaceStore>()(
  persist(
    (set, get) => ({
      workspaces: [],
      currentWorkspaceId: null,
      pendingInvites: [],

      // ✅ computed property - currentId getter
      get currentId() {
        return this.currentWorkspaceId;
      },

      setWorkspaces: (workspaces) => set({ workspaces }),

      setCurrentWorkspaceId: (currentWorkspaceId) =>
        set({ currentWorkspaceId }),

      // ✅ 하위 호환성을 위한 별칭
      setCurrentId: (currentWorkspaceId) => set({ currentWorkspaceId }),

      createWorkspace: (name: string, description?: string) => {
        const user = JSON.parse(localStorage.getItem("auth-storage") || "{}")
          ?.state?.user;
        if (!user) throw new Error("User not authenticated");

        const now = new Date().toISOString();
        const workspace: Workspace = {
          id: `ws_${Date.now()}_${Math.random().toString(36).substring(2)}`,
          name,
          description,
          ownerId: user.id,
          createdAt: now,
          updatedAt: now,
          members: [
            {
              userId: user.id,
              email: user.email,
              name: user.name,
              role: "owner",
              joinedAt: now,
              invitedBy: user.id,
            },
          ],
          settings: {
            allowMemberInvite: true,
            defaultRole: "member",
          },
        };

        set((state) => ({
          workspaces: [...state.workspaces, workspace],
          currentWorkspaceId: workspace.id,
        }));

        return workspace;
      },

      updateWorkspace: (id, updates) =>
        set((state) => ({
          workspaces: state.workspaces.map((ws) =>
            ws.id === id
              ? { ...ws, ...updates, updatedAt: new Date().toISOString() }
              : ws
          ),
        })),

      deleteWorkspace: (id) =>
        set((state) => ({
          workspaces: state.workspaces.filter((ws) => ws.id !== id),
          currentWorkspaceId:
            state.currentWorkspaceId === id ? null : state.currentWorkspaceId,
        })),

      inviteMember: (workspaceId, email, role) => {
        const user = JSON.parse(localStorage.getItem("auth-storage") || "{}")
          ?.state?.user;
        if (!user) return;

        const invite = {
          id: `inv_${Date.now()}_${Math.random().toString(36).substring(2)}`,
          workspaceId,
          email,
          role,
          invitedBy: user.id,
          createdAt: new Date().toISOString(),
          expiresAt: new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000
          ).toISOString(),
        };

        set((state) => ({
          pendingInvites: [...state.pendingInvites, invite],
        }));

        console.log("Member invited:", invite);
      },

      acceptInvite: (inviteId) => {
        const user = JSON.parse(localStorage.getItem("auth-storage") || "{}")
          ?.state?.user;
        if (!user) return;

        const { pendingInvites } = get();
        const invite = pendingInvites.find((inv) => inv.id === inviteId);
        if (!invite || invite.email !== user.email) return;

        const newMember = {
          userId: user.id,
          email: user.email,
          name: user.name,
          role: invite.role as "admin" | "member" | "viewer",
          joinedAt: new Date().toISOString(),
          invitedBy: invite.invitedBy,
        };

        set((state) => ({
          workspaces: state.workspaces.map((ws) =>
            ws.id === invite.workspaceId
              ? { ...ws, members: [...ws.members, newMember] }
              : ws
          ),
          pendingInvites: state.pendingInvites.filter(
            (inv) => inv.id !== inviteId
          ),
        }));
      },

      removeMember: (workspaceId, userId) =>
        set((state) => ({
          workspaces: state.workspaces.map((ws) =>
            ws.id === workspaceId
              ? {
                  ...ws,
                  members: ws.members.filter((m) => m.userId !== userId),
                }
              : ws
          ),
        })),

      updateMemberRole: (workspaceId, userId, role) =>
        set((state) => ({
          workspaces: state.workspaces.map((ws) =>
            ws.id === workspaceId
              ? {
                  ...ws,
                  members: ws.members.map((m) =>
                    m.userId === userId ? { ...m, role } : m
                  ),
                }
              : ws
          ),
        })),

      canInviteMembers: (workspaceId) => {
        const user = JSON.parse(localStorage.getItem("auth-storage") || "{}")
          ?.state?.user;
        if (!user) return false;

        const { workspaces } = get();
        const workspace = workspaces.find((ws) => ws.id === workspaceId);
        if (!workspace) return false;

        const member = workspace.members.find((m) => m.userId === user.id);
        return member?.role === "owner" || member?.role === "admin";
      },

      canRemoveMembers: (workspaceId) => {
        const user = JSON.parse(localStorage.getItem("auth-storage") || "{}")
          ?.state?.user;
        if (!user) return false;

        const { workspaces } = get();
        const workspace = workspaces.find((ws) => ws.id === workspaceId);
        if (!workspace) return false;

        const member = workspace.members.find((m) => m.userId === user.id);
        return member?.role === "owner" || member?.role === "admin";
      },

      getUserRole: (workspaceId, userId) => {
        const { workspaces } = get();
        const workspace = workspaces.find((ws) => ws.id === workspaceId);
        if (!workspace) return null;

        const member = workspace.members.find((m) => m.userId === userId);
        return member?.role || null;
      },
    }),
    {
      name: "workspace-storage",
    }
  )
);
