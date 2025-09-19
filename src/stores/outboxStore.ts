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

type State = { jobs: OutboxJob[]; isSyncing: boolean };
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

const base: StateCreator<Store, [], []> = (set, get) => ({
  jobs: [],
  isSyncing: false,
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
        : { jobs: [...s.jobs, job] }
    );
    return job;
  },
  dequeue: (id) => set((s) => ({ jobs: s.jobs.filter((j) => j.id !== id) })),
  clearAll: () => set({ jobs: [] }),
  flush: async () => {
    const { jobs } = get();
    if (!navigator.onLine || jobs.length === 0) return;
    set({ isSyncing: true });
    try {
      for (const job of jobs) {
        await new Promise((r) => setTimeout(r, 40)); // TODO: replace with API call
        get().dequeue(job.id);
      }
    } finally {
      set({ isSyncing: false });
    }
  },
});

export const useOutboxStore = create<Store>()(
  nsPersist<Store>("outbox", {
    partialize: (s) => ({ jobs: (s as Store).jobs } as Partial<Store>),
  })(base)
);

// namespace rotation on workspace change
useWorkspaceStore.subscribe(() => {
  (useOutboxStore as any).persist?.setOptions({ name: makeNsName("outbox") });
});

// Legacy compatibility shim
export function useOutboxStoreFactory(_userId?: string, _workspaceId?: string) {
  return useOutboxStore;
}
