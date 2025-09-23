// src/stores/persistNamespace.ts

import type { StateCreator } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

// 🔧 즉시 실행되는 동적 네임스페이스 생성
export function makeNsName(base: string): string {
  try {
    const authStorage = localStorage.getItem("auth-storage");
    const workspaceStorage = localStorage.getItem("workspace-storage");

    let userId: string | null = null;
    let workspaceId: string | null = null;

    if (authStorage) {
      userId = JSON.parse(authStorage).state?.user?.id ?? null;
    }

    if (workspaceStorage) {
      workspaceId =
        JSON.parse(workspaceStorage).state?.currentWorkspaceId ?? null;
    }

    if (userId && workspaceId) {
      return `inv:${userId}:${workspaceId}:${base}`;
    }

    // 로그인 전 또는 워크스페이스 선택 전 임시 키
    return `inv:waiting:${base}`;
  } catch (error) {
    console.error("makeNsName에서 오류 발생:", error);
    return `inv:error:${base}`;
  }
}

// ✅ 올바른 타입 정의로 수정된 워크스페이스 persist
export function createWorkspacePersist<T>(base: string) {
  return <U extends T = T>(
    config: StateCreator<T, [], [], U>
  ): StateCreator<T, [], [["zustand/persist", unknown]], U> => {
    return persist(config, {
      name: makeNsName(base),
      storage: createJSONStorage(() => localStorage),
      migrate: (persistedState: unknown, _version: number) => persistedState,
      partialize: (state) => {
        const nsName = makeNsName(base);
        if (nsName.includes(":waiting:") || nsName.includes(":error:")) {
          return {} as U;
        }
        return state;
      },
      onRehydrateStorage: () => (state, error) => {
        if (error) console.error(`${base} 복원 실패`, error);
      },
      version: 2,
    }) as StateCreator<T, [], [["zustand/persist", unknown]], U>;
  };
}

export const switchWorkspace = (newWorkspaceId: string) => {
  console.log("🔄 워크스페이스 전환:", newWorkspaceId);

  window.dispatchEvent(
    new CustomEvent("workspace-changed", {
      detail: { newWorkspaceId },
    })
  );
  console.log("워크스페이스 전환 완료");
};

export const cleanupTempKeys = () => {
  const keysToRemove: string[] = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (
      key &&
      (key.startsWith("inv:temp:") ||
        key.startsWith("inv:null:") ||
        key.startsWith("inv:default:") ||
        key.startsWith("inv:waiting:") ||
        key.startsWith("inv:error:"))
    ) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach((key) => {
    console.log("정리할 키:", key);
    localStorage.removeItem(key);
  });
  console.log(`임시 키 정리 완료: ${keysToRemove.length}개 삭제`);
};

export const cleanupAllWorkspaceKeys = () => {
  const keysToRemove: string[] = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith("inv:")) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach((key) => {
    console.log("워크스페이스 키 삭제:", key);
    localStorage.removeItem(key);
  });
  console.log(`워크스페이스 키 정리 완료: ${keysToRemove.length}개 삭제`);
};

export const getNamespace = (): string => {
  try {
    const persistedState = localStorage.getItem("workspace-storage");
    if (persistedState) {
      const parsed = JSON.parse(persistedState);
      const currentWorkspaceId = parsed?.state?.currentWorkspaceId;
      return currentWorkspaceId ? `ws_${currentWorkspaceId}` : "default";
    }
  } catch (error) {
    console.error("Failed to get namespace:", error);
  }
  return "default";
};

export const createNamespacedKey = (key: string): string => {
  const namespace = getNamespace();
  return `${namespace}_${key}`;
};

export const reloadWorkspaceStores = () => {
  console.log("워크스페이스 스토어들 새로고침");
  cleanupTempKeys();
  window.dispatchEvent(new CustomEvent("workspace-changed"));
};
