// src/stores/workspaceStore.ts

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type WorkspaceType =
  | "EVENT"
  | "OFFICE"
  | "WAREHOUSE"
  | "RETAIL"
  | "DEFAULT";

export interface WorkspaceMember {
  userId: string;
  email: string;
  name: string;
  role: "owner" | "admin" | "member" | "viewer";
  joinedAt: string;
  invitedBy: string;
}

export interface WorkspaceSettings {
  allowMemberInvite: boolean;
  defaultRole: "member" | "viewer";
}

export interface Workspace {
  id: string;
  name: string;
  description?: string;
  type: WorkspaceType;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  members: WorkspaceMember[];
  settings: WorkspaceSettings;
}

interface WorkspaceState {
  workspaces: Workspace[];
  currentWorkspaceId: string | null;
}

interface WorkspaceActions {
  setWorkspaces: (workspaces: Workspace[]) => void;
  setCurrentWorkspaceId: (id: string | null) => void;
  getCurrentWorkspace: () => Workspace | null;
  createWorkspace: (
    workspace: Omit<Workspace, "id" | "createdAt" | "updatedAt">
  ) => Workspace;
  updateWorkspace: (id: string, updates: Partial<Workspace>) => void;
  deleteWorkspace: (id: string) => void;
  addMember: (workspaceId: string, member: WorkspaceMember) => void;
  removeMember: (workspaceId: string, userId: string) => void;
  updateMemberRole: (
    workspaceId: string,
    userId: string,
    role: WorkspaceMember["role"]
  ) => void;
  getUserRole: (
    workspaceId: string,
    userId: string
  ) => WorkspaceMember["role"] | null;
  canUserAccess: (workspaceId: string, userId: string) => boolean;
  canUserEdit: (workspaceId: string, userId: string) => boolean;
}

type WorkspaceStore = WorkspaceState & WorkspaceActions;

export const useWorkspaceStore = create<WorkspaceStore>()(
  persist(
    (set, get) => ({
      workspaces: [],
      currentWorkspaceId: null,

      setWorkspaces: (workspaces) => {
        console.log("setWorkspaces 호출:", workspaces.length, "개");
        set({ workspaces });
      },

      setCurrentWorkspaceId: (id) => {
        console.log("setCurrentWorkspaceId 호출:", id);

        const previousId = get().currentWorkspaceId;
        set({ currentWorkspaceId: id });

        // 🔧 워크스페이스 변경 이벤트 발생
        if (previousId !== id) {
          console.log("워크스페이스 변경 이벤트 발생:", {
            previousId,
            newId: id,
          });
          window.dispatchEvent(
            new CustomEvent("workspace-changed", {
              detail: { previousWorkspaceId: previousId, workspaceId: id },
            })
          );
        }
      },

      getCurrentWorkspace: () => {
        const { workspaces, currentWorkspaceId } = get();
        const workspace = workspaces.find((ws) => ws.id === currentWorkspaceId);
        console.log("getCurrentWorkspace:", workspace?.name || "없음");
        return workspace || null;
      },

      createWorkspace: (workspaceData) => {
        console.log("📝 createWorkspace 호출됨");
        console.log("입력 데이터:", workspaceData);

        // 🔧 사용자 정보를 authStore에서 직접 가져오기
        const authStorage = localStorage.getItem("auth-storage");
        let user = null;
        if (authStorage) {
          try {
            const parsed = JSON.parse(authStorage);
            user = parsed?.state?.user;
          } catch (e) {
            console.error("Auth storage 파싱 실패:", e);
          }
        }

        if (!user) {
          console.error("❌ 사용자 정보를 찾을 수 없습니다!");
          throw new Error("사용자 정보가 없습니다.");
        }

        // 🔧 각 필드를 개별적으로 명시적 할당
        const workspace: Workspace = {
          id:
            globalThis.crypto?.randomUUID?.() ??
            `ws_${Date.now()}_${Math.random()}`,
          name: workspaceData.name || `${user.name}의 워크스페이스`,
          description: workspaceData.description || "기본 재고 관리 공간",
          type: workspaceData.type || "DEFAULT",
          ownerId: workspaceData.ownerId || user.id,
          members: workspaceData.members || [
            {
              userId: user.id,
              email: user.email,
              name: user.name,
              role: "owner" as const,
              joinedAt: new Date().toISOString(),
              invitedBy: user.id,
            },
          ],
          settings: {
            allowMemberInvite:
              workspaceData.settings?.allowMemberInvite ?? true,
            defaultRole: workspaceData.settings?.defaultRole ?? "member",
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        console.log("생성된 워크스페이스 객체:", workspace);

        // 유효성 검증
        if (!workspace.name) {
          console.error("❌ 워크스페이스 이름이 없습니다!");
          console.error("workspaceData:", workspaceData);
        }

        if (
          !Array.isArray(workspace.members) ||
          workspace.members.length === 0
        ) {
          console.error("❌ 멤버 정보가 올바르지 않습니다!");
          console.error("members:", workspace.members);
        }

        set((state) => {
          const newState = {
            workspaces: [...state.workspaces, workspace],
            currentWorkspaceId: workspace.id,
          };
          console.log("새로운 스토어 상태:", newState);
          return newState;
        });

        return workspace;
      },

      updateWorkspace: (id, updates) => {
        console.log("워크스페이스 업데이트:", id, updates);
        set((state) => ({
          workspaces: state.workspaces.map((ws) =>
            ws.id === id
              ? { ...ws, ...updates, updatedAt: new Date().toISOString() }
              : ws
          ),
        }));
      },

      deleteWorkspace: (id) => {
        console.log("워크스페이스 삭제:", id);
        set((state) => ({
          workspaces: state.workspaces.filter((ws) => ws.id !== id),
          currentWorkspaceId:
            state.currentWorkspaceId === id ? null : state.currentWorkspaceId,
        }));
      },

      addMember: (workspaceId, member) => {
        console.log("멤버 추가:", workspaceId, member);
        set((state) => ({
          workspaces: state.workspaces.map((ws) =>
            ws.id === workspaceId
              ? {
                  ...ws,
                  members: [...ws.members, member],
                  updatedAt: new Date().toISOString(),
                }
              : ws
          ),
        }));
      },

      removeMember: (workspaceId, userId) => {
        console.log("멤버 제거:", workspaceId, userId);
        set((state) => ({
          workspaces: state.workspaces.map((ws) =>
            ws.id === workspaceId
              ? {
                  ...ws,
                  members: ws.members.filter((m) => m.userId !== userId),
                  updatedAt: new Date().toISOString(),
                }
              : ws
          ),
        }));
      },

      updateMemberRole: (workspaceId, userId, role) => {
        console.log("멤버 역할 업데이트:", workspaceId, userId, role);
        set((state) => ({
          workspaces: state.workspaces.map((ws) =>
            ws.id === workspaceId
              ? {
                  ...ws,
                  members: ws.members.map((m) =>
                    m.userId === userId ? { ...m, role } : m
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : ws
          ),
        }));
      },

      getUserRole: (workspaceId, userId) => {
        const workspace = get().workspaces.find((ws) => ws.id === workspaceId);
        if (!workspace || !workspace.members) return null;

        const member = workspace.members.find((m) => m.userId === userId);
        return member?.role || null;
      },

      canUserAccess: (workspaceId, userId) => {
        const role = get().getUserRole(workspaceId, userId);
        return role !== null;
      },

      canUserEdit: (workspaceId, userId) => {
        const role = get().getUserRole(workspaceId, userId);
        return role === "owner" || role === "admin" || role === "member";
      },
    }),
    {
      name: "workspace-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
