// src/stores/outboxStore.ts
import { create } from "zustand";
import type { StateCreator } from "zustand";
import { nsPersist, makeNsName } from "./persistNamespace";
import { useWorkspaceStore } from "./workspaceStore";

export type MovementKind = "IN" | "OUT" | "TRANSFER";

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

const createOutboxStore: StateCreator<Store, [], [], Store> = (set, get) => ({
  jobs: [],
  isSyncing: false,
  lastSyncAt: undefined,

  enqueueMovement: (ctx, p) => {
    const movementId =
      p.movementId ??
      globalThis.crypto?.randomUUID?.() ??
      `${Date.now()}-${Math.random()}`;

    const job: OutboxJob = {
      id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
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

  clearAll: () => set({ jobs: [], isSyncing: false, lastSyncAt: undefined }),

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
});

export const useOutboxStore = create<Store>()(
  nsPersist("outbox", {
    partialize: (s) => ({
      jobs: s.jobs,
      lastSyncAt: s.lastSyncAt,
    }),
  })(createOutboxStore)
);

// namespace rotation on workspace change
useWorkspaceStore.subscribe(() => {
  (useOutboxStore as any).persist?.setOptions({ name: makeNsName("outbox") });
});

// Legacy compatibility shim
export function useOutboxStoreFactory(_userId?: string, _workspaceId?: string) {
  return useOutboxStore;
}
