// src/stores/outbox.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type MovementKind = "IN" | "OUT" | "TRANSFER";
export type OutboxJob = {
  id: string; // uuid
  workspaceId: string;
  userId: string;
  kind: "MOVEMENT_APPLY";
  payload: {
    movementId: string;
    itemId: string;
    lotId?: string;
    qty: number;
    reason?: string;
    type: MovementKind;
    fromWsId?: string;
    toWsId?: string;
  };
  idempotencyKey: string; // `${workspaceId}:${movementId}`
  createdAt: number;
  retries: number;
};

type OutboxState = {
  jobs: OutboxJob[];
  enqueue: (job: OutboxJob) => void;
  dequeue: (id: string) => void;
  clearAll: () => void;
};

type SyncState = {
  isSyncing: boolean;
  setSyncing: (v: boolean) => void;
  flush: (ctx: { workspaceId: string; userId: string }) => Promise<void>;
};

const storageFor = (userId: string, workspaceId: string) =>
  createJSONStorage(() => localStorage, {
    // optional custom reviver/replacer if needed
  });

export const useOutboxStoreFactory = (userId: string, workspaceId: string) =>
  create<OutboxState & SyncState>()(
    persist(
      (set, get) => ({
        jobs: [],
        isSyncing: false,
        enqueue: (job) =>
          set((s) => {
            if (s.jobs.some((j) => j.idempotencyKey === job.idempotencyKey))
              return s;
            return { jobs: [...s.jobs, job] };
          }),
        dequeue: (id) =>
          set((s) => ({ jobs: s.jobs.filter((j) => j.id !== id) })),
        clearAll: () => set({ jobs: [] }),
        setSyncing: (v) => set({ isSyncing: v }),
        flush: async () => {
          const { jobs } = get();
          if (!navigator.onLine || jobs.length === 0) return;
          set({ isSyncing: true });
          try {
            for (const job of jobs) {
              // Replace with service call
              // await api.applyMovement(job.payload, { idempotencyKey: job.idempotencyKey });
              // simulate success
              await new Promise((r) => setTimeout(r, 50));
              get().dequeue(job.id);
            }
          } finally {
            set({ isSyncing: false });
          }
        },
      }),
      {
        name: `outbox:${userId}:${workspaceId}`,
        storage: storageFor(userId, workspaceId),
        partialize: (s) => ({ jobs: s.jobs }), // persist only jobs
        version: 1,
      }
    )
  );
