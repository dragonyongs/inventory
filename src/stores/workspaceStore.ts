// src/stores/workspaceStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type WorkspaceType =
  | "DEFAULT"
  | "RETAIL"
  | "WAREHOUSE"
  | "RESTAURANT"
  | "PHARMACY"
  | "GENERAL";

export interface Workspace {
  id: string;
  name: string;
  description?: string;
  type: WorkspaceType;
  createdAt: string;
  updatedAt: string;
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
  updateWorkspace: (id: string, data: Partial<Workspace>) => void;
  deleteWorkspace: (id: string) => void;
  switchWorkspace: (id: string) => void;
  setCurrentWorkspaceId: (id: string | null) => void;
  getCurrentWorkspace: () => Workspace | null;
  ensureDefaultWorkspace: () => void;
  initialize: () => void;
}

type WorkspaceStore = WorkspaceState & WorkspaceActions;

// 사용자 이름 기반 워크스페이스 생성 함수
const createUserWorkspace = (): Workspace => {
  try {
    const authStorage = localStorage.getItem("auth-storage");
    let userName = "사용자";

    if (authStorage) {
      const parsed = JSON.parse(authStorage);
      const user = parsed.state?.user;
      if (user?.name) {
        userName = user.name;
      } else if (user?.email) {
        userName = user.email.split("@")[0];
      }
    }

    return {
      id: "user-workspace",
      name: `${userName}의 재고관리`,
      description: `${userName}님 워크스페이스`,
      type: "DEFAULT",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("사용자 워크스페이스 생성 실패:", error);
    // 기본 워크스페이스로 폴백
    return {
      id: "default-workspace",
      name: "기본 워크스페이스",
      description: "기본 재고 관리 워크스페이스",
      type: "DEFAULT",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }
};

export const useWorkspaceStore = create<WorkspaceStore>()(
  persist(
    (set, get) => ({
      workspaces: [],
      currentWorkspaceId: null,
      isInitialized: false,

      initialize: () => {
        const state = get();

        // 이미 초기화되었으면 무시
        if (state.isInitialized) {
          console.log("워크스페이스 이미 초기화됨 - 스킵");
          return;
        }

        console.log("🎯 워크스페이스 초기화 시작");

        // 워크스페이스가 없는 경우에만 생성
        if (state.workspaces.length === 0) {
          const userWorkspace = createUserWorkspace();

          set({
            workspaces: [userWorkspace],
            currentWorkspaceId: userWorkspace.id,
            isInitialized: true,
          });

          console.log("✅ 사용자 워크스페이스 생성:", userWorkspace.name);

          // 초기화 완료 후 이벤트 발생
          setTimeout(() => {
            window.dispatchEvent(
              new CustomEvent("workspace-changed", {
                detail: { workspaceId: userWorkspace.id },
              })
            );
          }, 100);
        } else {
          // 기존 워크스페이스가 있는 경우
          const currentId = state.currentWorkspaceId || state.workspaces[0]?.id;

          set({
            currentWorkspaceId: currentId,
            isInitialized: true,
          });

          console.log("✅ 기존 워크스페이스 선택:", currentId);

          // 워크스페이스 변경 이벤트 발생
          if (currentId) {
            setTimeout(() => {
              window.dispatchEvent(
                new CustomEvent("workspace-changed", {
                  detail: { workspaceId: currentId },
                })
              );
            }, 100);
          }
        }
      },

      createWorkspace: (data) => {
        const state = get();

        // 동일한 이름의 워크스페이스가 이미 있는지 확인
        const existingWorkspace = state.workspaces.find(
          (ws) =>
            ws.name.trim().toLowerCase() === data.name.trim().toLowerCase()
        );

        if (existingWorkspace) {
          console.log("🔄 기존 워크스페이스로 전환:", existingWorkspace.name);
          set({ currentWorkspaceId: existingWorkspace.id });

          // 워크스페이스 변경 이벤트 발생
          window.dispatchEvent(
            new CustomEvent("workspace-changed", {
              detail: { workspaceId: existingWorkspace.id },
            })
          );

          return existingWorkspace;
        }

        // 새 워크스페이스 생성
        const newWorkspace: Workspace = {
          id: `ws-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: data.name.trim(),
          description: data.description?.trim(),
          type: data.type,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        set((state) => ({
          workspaces: [...state.workspaces, newWorkspace],
          currentWorkspaceId: newWorkspace.id,
        }));

        console.log("🆕 새 워크스페이스 생성:", newWorkspace.name);

        // 워크스페이스 변경 이벤트 발생
        window.dispatchEvent(
          new CustomEvent("workspace-changed", {
            detail: { workspaceId: newWorkspace.id },
          })
        );

        return newWorkspace;
      },

      updateWorkspace: (id, data) => {
        set((state) => ({
          workspaces: state.workspaces.map((ws) =>
            ws.id === id
              ? {
                  ...ws,
                  ...data,
                  updatedAt: new Date().toISOString(),
                }
              : ws
          ),
        }));
      },

      deleteWorkspace: (id) => {
        const state = get();

        // 기본/사용자 워크스페이스는 삭제 불가
        if (id === "default-workspace" || id === "user-workspace") {
          console.log("기본 워크스페이스는 삭제할 수 없습니다.");
          return;
        }

        // 마지막 워크스페이스 삭제 시 사용자 워크스페이스 생성
        if (state.workspaces.length <= 1) {
          const userWorkspace = createUserWorkspace();
          set({
            workspaces: [userWorkspace],
            currentWorkspaceId: userWorkspace.id,
          });

          window.dispatchEvent(
            new CustomEvent("workspace-changed", {
              detail: { workspaceId: userWorkspace.id },
            })
          );
          return;
        }

        const remainingWorkspaces = state.workspaces.filter(
          (ws) => ws.id !== id
        );

        // 현재 워크스페이스가 삭제되는 경우 첫 번째 워크스페이스로 전환
        let newCurrentId = state.currentWorkspaceId;
        if (state.currentWorkspaceId === id) {
          newCurrentId = remainingWorkspaces[0]?.id || null;
        }

        set({
          workspaces: remainingWorkspaces,
          currentWorkspaceId: newCurrentId,
        });

        // 워크스페이스 변경 이벤트 발생
        if (newCurrentId) {
          window.dispatchEvent(
            new CustomEvent("workspace-changed", {
              detail: { workspaceId: newCurrentId },
            })
          );
        }
      },

      switchWorkspace: (id) => {
        const state = get();
        const workspace = state.workspaces.find((ws) => ws.id === id);
        if (workspace) {
          set({ currentWorkspaceId: id });
          console.log("🔄 워크스페이스 전환:", workspace.name);

          // 워크스페이스 변경 이벤트 발생
          window.dispatchEvent(
            new CustomEvent("workspace-changed", {
              detail: { workspaceId: id },
            })
          );
        }
      },

      setCurrentWorkspaceId: (id) => {
        set({ currentWorkspaceId: id });
        if (id) {
          window.dispatchEvent(
            new CustomEvent("workspace-changed", {
              detail: { workspaceId: id },
            })
          );
        }
      },

      getCurrentWorkspace: () => {
        const state = get();
        if (!state.currentWorkspaceId) return null;
        return (
          state.workspaces.find((ws) => ws.id === state.currentWorkspaceId) ||
          null
        );
      },

      ensureDefaultWorkspace: () => {
        const state = get();
        // initialize가 한 번만 호출되도록 보장
        if (!state.isInitialized) {
          console.log("🎯 ensureDefaultWorkspace에서 초기화 시작");
          state.initialize();
        } else {
          console.log("📍 워크스페이스 이미 초기화됨");
        }
      },
    }),
    {
      name: "inventory-workspaces",
      version: 3, // 버전 업그레이드로 기존 데이터 정리
      onRehydrateStorage: () => (state) => {
        if (state && !state.isInitialized) {
          console.log("🔄 워크스페이스 스토어 rehydrate");
          // rehydrate 후 단 한 번만 초기화
          setTimeout(() => {
            if (!state.isInitialized) {
              // 다시 한번 체크
              state.initialize();
            }
          }, 100);
        }
      },
    }
  )
);
