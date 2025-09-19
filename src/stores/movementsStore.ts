// src/stores/movementsStore.ts
import { create, type StateCreator } from "zustand";
import { nsPersist, makeNsName } from "./persistNamespace";
import { useWorkspaceStore } from "./workspaceStore";
import type { Movement as DomainMovement } from "../types/domain";

// 선택: Outbox 연동이 이미 구성되어 있다면 사용, 아니면 주석 처리 가능
import { useOutboxStore } from "./outboxStore";

// 상태 모델: byId 단일 소스 (배열 노출/게터 없음)
type State = {
  byId: Record<string, DomainMovement>;
};

type Actions = {
  // 표준 액션
  push: (m: DomainMovement) => void;
  pushMany: (ms: DomainMovement[]) => void;
  bulk: (ms: DomainMovement[]) => void;
  remove: (id: string) => void;
  reset: () => void;

  // 레거시/호환 액션: 간편 생성
  create: (p: {
    itemId: string;
    type: DomainMovement["type"];
    qty: number;
    reason?: string;
    lotId?: string;
    actor?: string;
    createdAt?: string;
  }) => DomainMovement;
};

type Store = State & Actions;

// 초기 상태
const initial: State = { byId: {} };

// 유틸: 안전한 UUID 생성
const makeId = () =>
  (globalThis.crypto as any)?.randomUUID?.() ??
  `mov_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

// 구현
const base: StateCreator<Store> = (set, get) => ({
  ...initial,

  push: (m) =>
    set((s) => ({
      byId: { ...s.byId, [m.id]: m },
    })),

  pushMany: (ms) =>
    set((s) => {
      const next = { ...s.byId };
      for (const m of ms) next[m.id] = m;
      return { byId: next };
    }),

  bulk: (ms) =>
    set(() => ({
      byId: Object.fromEntries(ms.map((m) => [m.id, m])),
    })),

  remove: (id) =>
    set((s) => {
      if (!(id in s.byId)) return s;
      const next = { ...s.byId };
      delete next[id];
      return { byId: next };
    }),

  reset: () => set(initial),

  // 레거시 호환: 최소 필수 필드로 Movement 생성 후 push
  create: ({ itemId, type, qty, reason, lotId, actor, createdAt }) => {
    const wsId = useWorkspaceStore.getState().currentId;
    if (!wsId) throw new Error("No active workspace");

    const movement: DomainMovement = {
      id: makeId(),
      type,
      itemId,
      lotId,
      qty,
      reason,
      actor,
      createdAt: createdAt ?? new Date().toISOString(),
    };

    // 상태 반영
    get().push(movement);

    // 선택: Outbox 큐에 적재(온라인 동기화 대비)
    try {
      useOutboxStore.getState().enqueueMovement(
        { workspaceId: wsId, userId: actor ?? "local-user" },
        {
          movementId: movement.id,
          itemId: movement.itemId,
          qty: movement.qty,
          type:
            (movement.type as any) === "ADJUST" ? "IN" : (movement.type as any), // 서버 타입 제약 시 보정 가능
          reason: movement.reason,
          lotId: movement.lotId,
        }
      );
    } catch {
      // Outbox 미사용 환경이면 조용히 무시
    }

    return movement;
  },
});

// 퍼시스트 + 워크스페이스 네임스페이스 적용
export const useMovementsStore = create<Store>()(
  nsPersist("movements", {
    partialize: (s) => ({ byId: s.byId }),
  })(base)
);

// 워크스페이스 전환 시 퍼시스트 네임 변경
useWorkspaceStore.subscribe(() => {
  (useMovementsStore as any)?.persist?.setOptions?.({
    name: makeNsName("movements"),
  });
});
