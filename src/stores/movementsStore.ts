// src/stores/movementsStore.ts

import { create } from "zustand";
import { createWorkspacePersist } from "./persistNamespace";

export type MovementKind =
  | "IN" // 재고 증가 (어디든 들어옴)
  | "OUT" // 재고 감소 (어디든 나감)
  | "USE" // 재고 감소 (현장에서 소모/사용)
  | "ADJUST" // 재고 조정 (관리자)
  | "TRANSFER"; // 위치 이동 (재고는 유지)

export type Movement = {
  id: string;
  workspaceId: string; // 🔧 필수로 변경
  itemId: string;
  type: MovementKind;
  qty: number;
  reason?: string;
  note?: string; // 🔧 note 필드 추가 (selectors에서 사용)
  actor?: string;
  createdAt: string;
};

type State = {
  byId: Record<string, Movement>;
  query: string;
};

type Actions = {
  add: (m: Movement) => void;
  addMany: (ms: Movement[]) => void;
  bulk: (ms: Movement[]) => void;
  create: (p: {
    itemId: string;
    type: MovementKind;
    qty: number;
    reason?: string;
    note?: string;
  }) => Movement;
  remove: (id: string) => void;
  reset: () => void;
  setQuery: (q: string) => void;
  getVisible: () => Movement[];
  getWorkspaceMovements: () => Movement[];
};

type Store = State & Actions;

// 🔧 워크스페이스별 현재 ID를 가져오는 유틸리티 함수
const getCurrentWorkspaceId = (): string | null => {
  try {
    const workspaceStorage = localStorage.getItem("workspace-storage");
    if (workspaceStorage) {
      const parsed = JSON.parse(workspaceStorage);
      return parsed?.state?.currentWorkspaceId;
    }
  } catch (e) {
    console.error("워크스페이스 ID 가져오기 실패:", e);
  }
  return null;
};

export const useMovementsStore = create<Store>()(
  createWorkspacePersist<Store>("movements")((set, get) => ({
    byId: {},
    query: "",

    add: (m: Movement) => {
      // 🔧 워크스페이스 ID 검증
      if (!m.workspaceId) {
        console.error("❌ 워크스페이스 ID가 없는 이동:", m);
        return;
      }

      console.log(
        "✅ 이동 추가:",
        m.type,
        m.qty,
        "워크스페이스:",
        m.workspaceId
      );
      set((s) => ({
        byId: { ...s.byId, [m.id]: m },
      }));
    },

    addMany: (ms: Movement[]) => {
      // 🔧 워크스페이스 ID가 있는 이동만 필터링
      const validMovements = ms.filter((m) => m.workspaceId);
      console.log("이동 addMany:", validMovements.length, "개");

      const movementsMap = Object.fromEntries(
        validMovements.map((m) => [m.id, m])
      );
      set((s) => ({
        byId: { ...s.byId, ...movementsMap },
      }));
    },

    bulk: (ms: Movement[]) => {
      // 🔧 워크스페이스 ID가 있는 이동만 필터링
      const validMovements = ms.filter((m) => m.workspaceId);
      console.log("이동 bulk:", validMovements.length, "개");

      set(() => ({
        byId: Object.fromEntries(validMovements.map((m) => [m.id, m])),
        query: "",
      }));
    },

    create: ({ itemId, type, qty, reason, note }) => {
      const currentWorkspaceId = getCurrentWorkspaceId();

      if (!currentWorkspaceId) {
        console.error("현재 워크스페이스 ID를 찾을 수 없습니다!");
        throw new Error("워크스페이스를 선택해주세요.");
      }

      const movement: Movement = {
        id:
          globalThis.crypto?.randomUUID?.() ??
          `mov_${Date.now()}_${Math.random()}`,
        workspaceId: currentWorkspaceId, // 🔧 현재 워크스페이스 ID 할당
        itemId,
        type,
        qty,
        reason,
        note,
        actor: "user",
        createdAt: new Date().toISOString(),
      };

      console.log(
        "✅ 이동 생성:",
        movement.type,
        movement.qty,
        "워크스페이스:",
        currentWorkspaceId,
        "아이템:",
        itemId
      );

      set((s) => ({
        byId: { ...s.byId, [movement.id]: movement },
      }));

      return movement;
    },

    remove: (id) =>
      set((s) => {
        const next = { ...s.byId };
        delete next[id];
        return { byId: next, query: s.query };
      }),

    reset: () => set({ byId: {}, query: "" }),

    setQuery: (q) => set((s) => ({ ...s, query: q })),

    // 🔧 현재 워크스페이스의 이동만 반환
    getWorkspaceMovements: () => {
      const currentWorkspaceId = getCurrentWorkspaceId();

      if (!currentWorkspaceId) {
        console.log("현재 워크스페이스 ID가 없어서 빈 배열 반환");
        return [];
      }

      const allMovements = get().byId;
      const workspaceMovements = Object.values(allMovements).filter(
        (movement) => movement.workspaceId === currentWorkspaceId
      );

      console.log(
        `🔍 현재 워크스페이스(${currentWorkspaceId})의 이동: ${workspaceMovements.length}개`,
        "전체:",
        Object.values(allMovements).length,
        "개"
      );
      return workspaceMovements;
    },

    getVisible: (): Movement[] => {
      const state = get();
      const q = state.query.trim().toLowerCase();
      const workspaceMovements = get().getWorkspaceMovements(); // 🔧 워크스페이스 필터링된 이동만 사용

      const sorted = workspaceMovements.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      return q
        ? sorted.filter(
            (m) =>
              m.reason?.toLowerCase().includes(q) ||
              m.note?.toLowerCase().includes(q) ||
              m.type.toLowerCase().includes(q)
          )
        : sorted;
    },
  }))
);

// 🔧 워크스페이스 변경 이벤트 리스너
window.addEventListener("workspace-changed", (event: any) => {
  console.log("이동 스토어: 워크스페이스 변경 감지", event.detail);

  // 새 워크스페이스로 전환 시 강제 리프레시
  const newWorkspaceId = event.detail?.workspaceId;
  if (newWorkspaceId) {
    const movements = useMovementsStore.getState().getWorkspaceMovements();
    console.log("워크스페이스 변경 후 이동 데이터:", movements.length, "개");
  }
});
