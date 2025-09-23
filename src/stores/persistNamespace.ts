// src/stores/persistNamespace.ts

import { createJSONStorage, persist } from "zustand/middleware";
import type { StateCreator } from "zustand";

// 🔧 즉시 실행되는 동적 네임스페이스 생성
export function makeNsName(base: string): string {
  // 매번 최신 정보를 localStorage에서 직접 읽음
  const getCurrentNamespace = () => {
    try {
      const authStorage = localStorage.getItem("auth-storage");
      const workspaceStorage = localStorage.getItem("workspace-storage");

      let userId = null;
      let workspaceId = null;

      if (authStorage) {
        const authParsed = JSON.parse(authStorage);
        userId = authParsed?.state?.user?.id;
      }

      if (workspaceStorage) {
        const workspaceParsed = JSON.parse(workspaceStorage);
        workspaceId = workspaceParsed?.state?.currentWorkspaceId;
      }

      console.log(
        `makeNsName 체크 - userId: ${userId}, workspaceId: ${workspaceId}`
      );

      if (userId && workspaceId) {
        const nsName = `inv:${userId}:${workspaceId}:${base}`;
        console.log(`✅ 정상 네임스페이스: ${nsName}`);
        return nsName;
      }

      // 정보가 없으면 기본값 (하지만 실제로는 사용하지 않도록)
      console.warn(
        `⚠️ 네임스페이스 생성 실패 - 기본값 사용: inv:waiting:${base}`
      );
      return `inv:waiting:${base}`;
    } catch (error) {
      console.error("makeNsName 오류:", error);
      return `inv:error:${base}`;
    }
  };

  return getCurrentNamespace();
}

// 🔧 개선된 워크스페이스 persist - 타입 수정 및 migrate 추가
export function createWorkspacePersist<T>(base: string) {
  return (
    config: StateCreator<T, [], [], T>
  ): StateCreator<T, [], [["zustand/persist", unknown]], T> => {
    return persist(config, {
      // 🔧 동적으로 키 이름 생성하는 함수
      name: makeNsName(base), // 함수 호출이 아닌 직접 값 사용
      storage: createJSONStorage(() => localStorage),

      // 🔧 마이그레이션 함수 추가 (버전 변경 시 데이터 호환성 보장)
      migrate: (persistedState: any, version: number) => {
        console.log(`🔄 ${base} 스토어 마이그레이션 - 버전: ${version}`);

        if (base === "movements") {
          // 이동 데이터 마이그레이션
          if (persistedState && persistedState.byId) {
            const movements = Object.values(persistedState.byId as any[]);
            const validMovements = movements.filter((m: any) => m.workspaceId);

            console.log(
              `이동 데이터 마이그레이션: ${movements.length}개 → ${validMovements.length}개`
            );

            return {
              ...persistedState,
              byId: Object.fromEntries(
                validMovements.map((m: any) => [m.id, m])
              ),
            };
          }
        }

        return persistedState;
      },

      // 🔧 저장 전에 유효성 검사
      partialize: (state) => {
        const nsName = makeNsName(base);

        // waiting이나 error 상태면 저장하지 않음
        if (nsName.includes(":waiting:") || nsName.includes(":error:")) {
          console.log(`${base} 저장 건너뛰기: 유효하지 않은 네임스페이스`);
          return {} as T; // 빈 상태 반환
        }

        console.log(`${base} 저장: ${nsName}`, state);
        return state;
      },

      onRehydrateStorage: () => {
        console.log(`${base} 스토어 복원 시작`);
        return (state, error) => {
          if (error) {
            console.error(`${base} 스토어 복원 실패:`, error);
          } else {
            console.log(`${base} 스토어 복원 완료:`, state);
          }
        };
      },
      version: 2, // 🔧 버전을 2로 증가하여 마이그레이션 트리거
    });
  };
}

// 🔧 워크스페이스 변경 이벤트
export const switchWorkspace = (newWorkspaceId: string) => {
  console.log("🔄 워크스페이스 전환:", newWorkspaceId);

  // 워크스페이스 변경 이벤트 발생
  window.dispatchEvent(
    new CustomEvent("workspace-changed", {
      detail: { newWorkspaceId },
    })
  );
  console.log("워크스페이스 전환 완료");
};

// temp 키와 잘못된 키 정리
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

// 모든 워크스페이스 관련 키 삭제
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
