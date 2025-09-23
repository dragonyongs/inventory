// src/utils/persistNamespace.ts
import type { StateCreator } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

// 단순화된 네임스페이스 생성 (일관성 보장)
export function makeNsName(base: string): string {
  // 고정된 키 사용으로 일관성 보장
  return `inventory-${base}`;
}

// 워크스페이스 persist 헬퍼 (단순화)
export function createWorkspacePersist<T>(base: string) {
  return (config: StateCreator<T, [], [], T>): StateCreator<T, [], [], T> => {
    return persist(config, {
      name: makeNsName(base),
      storage: createJSONStorage(() => localStorage),
      version: 1,
      onRehydrateStorage: () => (state, error) => {
        if (error) console.error(`${base} 복원 실패`, error);
      },
    }) as StateCreator<T, [], [], T>;
  };
}

// 워크스페이스 전환 (단순화)
export const switchWorkspace = (newWorkspaceId: string) => {
  console.log("🔄 워크스페이스 전환:", newWorkspaceId);
  window.dispatchEvent(
    new CustomEvent("workspace-changed", {
      detail: { workspaceId: newWorkspaceId },
    })
  );
};

// 임시 키 정리
export const cleanupTempKeys = () => {
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (
      key &&
      (key.startsWith("inv:temp:") ||
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
  return keysToRemove.length;
};

// 모든 워크스페이스 관련 키 정리 (DevTools용)
export const cleanupAllWorkspaceKeys = () => {
  const keysToRemove: string[] = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith("inventory-")) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach((key) => {
    console.log("정리할 키:", key);
    localStorage.removeItem(key);
  });

  console.log(`워크스페이스 키 정리 완료: ${keysToRemove.length}개 삭제`);
  return keysToRemove.length;
};

// 특정 워크스페이스 키 정리
export const cleanupWorkspaceKeys = (workspaceId: string) => {
  const keysToRemove: string[] = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.includes(workspaceId)) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach((key) => {
    console.log("정리할 워크스페이스 키:", key);
    localStorage.removeItem(key);
  });

  console.log(
    `워크스페이스 ${workspaceId} 키 정리 완료: ${keysToRemove.length}개 삭제`
  );
  return keysToRemove.length;
};

// 전체 localStorage 정보 가져오기 (디버깅용)
export const getStorageInfo = () => {
  const info: Record<string, any> = {};

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      try {
        const value = localStorage.getItem(key);
        if (value) {
          info[key] = {
            size: `${Math.round((value.length / 1024) * 100) / 100}KB`,
            value: value.length > 100 ? value.substring(0, 100) + "..." : value,
          };
        }
      } catch (e) {
        info[key] = { error: "Parse error" };
      }
    }
  }

  return info;
};

// 재고관리 관련 키만 가져오기
export const getInventoryKeys = () => {
  const keys: string[] = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.startsWith("inventory-") || key === "auth-storage")) {
      keys.push(key);
    }
  }

  return keys;
};

// localStorage 사용량 계산
export const getStorageUsage = () => {
  let totalSize = 0;
  let inventorySize = 0;

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      const value = localStorage.getItem(key);
      if (value) {
        const size = new Blob([value]).size;
        totalSize += size;

        if (key.startsWith("inventory-") || key === "auth-storage") {
          inventorySize += size;
        }
      }
    }
  }

  return {
    total: `${Math.round((totalSize / 1024) * 100) / 100}KB`,
    inventory: `${Math.round((inventorySize / 1024) * 100) / 100}KB`,
    percentage:
      totalSize > 0 ? Math.round((inventorySize / totalSize) * 100) : 0,
  };
};
