// src/stores/outboxStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type MovementKind =
  | "IN" // 재고 증가 (어디든 들어옴)
  | "OUT" // 재고 감소 (어디든 나감)
  | "USE" // 재고 감소 (현장에서 소모/사용)
  | "ADJUST" // 재고 조정 (관리자)
  | "TRANSFER"; // 위치 이동 (재고는 유지)

export type MovementJobPayload = {
  movementId: string;
  itemId: string;
  qty: number;
  type: MovementKind;
  reason?: string;
  lotId?: string;
  fromWsId?: string;
  toWsId?: string;
};

export type OutboxJob = {
  id: string;
  workspaceId: string;
  userId: string;
  kind: "MOVEMENT_APPLY";
  payload: MovementJobPayload;
  idempotencyKey: string;
  createdAt: number;
  retries: number;
};

type State = {
  jobs: OutboxJob[];
  isSyncing: boolean;
  lastSyncAt?: string;
};

type Actions = {
  enqueueMovement: (
    ctx: { workspaceId: string; userId: string },
    p: Omit<MovementJobPayload, "movementId"> & { movementId?: string }
  ) => OutboxJob;
  dequeue: (id: string) => void;
  clearAll: () => void;
  flush: (ctx: { workspaceId: string; userId: string }) => Promise<void>;
};

type Store = State & Actions;

export const useOutboxStore = create<Store>()(
  persist(
    (set, get) => ({
      jobs: [],
      isSyncing: false,
      lastSyncAt: undefined,

      enqueueMovement: (ctx, p) => {
        const movementId =
          p.movementId ??
          globalThis.crypto?.randomUUID?.() ??
          `${Date.now()}-${Math.random()}`;

        const job: OutboxJob = {
          id:
            globalThis.crypto?.randomUUID?.() ??
            `${Date.now()}-${Math.random()}`,
          workspaceId: ctx.workspaceId,
          userId: ctx.userId,
          kind: "MOVEMENT_APPLY",
          payload: { ...p, movementId },
          idempotencyKey: `${ctx.workspaceId}:${movementId}`,
          createdAt: Date.now(),
          retries: 0,
        };

        set((s) =>
          s.jobs.some((j) => j.idempotencyKey === job.idempotencyKey)
            ? s
            : { ...s, jobs: [...s.jobs, job] }
        );

        return job;
      },

      dequeue: (id) =>
        set((s) => ({ ...s, jobs: s.jobs.filter((j) => j.id !== id) })),

      clearAll: () =>
        set({ jobs: [], isSyncing: false, lastSyncAt: undefined }),

      flush: async () => {
        const { jobs } = get();
        if (!navigator.onLine || jobs.length === 0) return;

        set((s) => ({ ...s, isSyncing: true }));

        try {
          for (const job of jobs) {
            await new Promise((r) => setTimeout(r, 40)); // TODO: replace with API call
            get().dequeue(job.id);
          }

          set((s) => ({ ...s, lastSyncAt: new Date().toISOString() }));
        } finally {
          set((s) => ({ ...s, isSyncing: false }));
        }
      },
    }),
    {
      name: "outbox-storage",
      partialize: (s) => ({
        jobs: s.jobs,
        lastSyncAt: s.lastSyncAt,
      }),
    }
  )
);

// Legacy compatibility shim
export function useOutboxStoreFactory(_userId?: string, _workspaceId?: string) {
  return useOutboxStore;
}
