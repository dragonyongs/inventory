// tests/workspace-isolation.spec.ts
import { describe, it, expect } from "vitest";
import { useOutboxStoreFactory } from "@/stores/outbox";

describe("Outbox namespace isolation", () => {
  it("keeps jobs isolated per user/workspace", async () => {
    const A = useOutboxStoreFactory("u1", "wa");
    const B = useOutboxStoreFactory("u1", "wb");

    A.getState().enqueue({
      id: "j1",
      workspaceId: "wa",
      userId: "u1",
      kind: "MOVEMENT_APPLY",
      payload: { movementId: "m1", itemId: "i1", qty: 1, type: "IN" },
      idempotencyKey: "wa:m1",
      createdAt: Date.now(),
      retries: 0,
    });

    expect(A.getState().jobs).toHaveLength(1);
    expect(B.getState().jobs).toHaveLength(0);
  });
});
