// src/hooks/useCreateMovement.ts
import { useCallback } from "react";
import { MovementInputSchema } from "../types/schemas";
import type { MovementInput } from "../types/schemas";
import type { Movement } from "../types/domain";
import { applyMovementToLots } from "../utils/applyMovement";

import { useLotsStore } from "../stores/lotsStore";
import { useMovementsStore } from "../stores/movementsStore";
import { useAuthStore } from "../stores/authStore";
import { useWorkspaceStore } from "../stores/workspaceStore";

function makeId() {
  return (
    (globalThis.crypto as any)?.randomUUID?.() ??
    `mov_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  );
}

export function useCreateMovement() {
  const { replaceMany } = useLotsStore.getState();
  const { push: pushMovement } = useMovementsStore.getState();
  const { user } = useAuthStore.getState();
  const { currentId: wsId, can } = useWorkspaceStore.getState();

  return useCallback(
    (input: MovementInput) => {
      if (!wsId || !can(wsId, "edit")) {
        throw new Error("No permission");
      }

      const parsed = MovementInputSchema.safeParse(input);
      if (!parsed.success) {
        throw new Error(parsed.error.issues.map((i) => i.message).join(", "));
      }

      const now = new Date().toISOString();
      const movement: Movement = {
        id: makeId(),
        type: parsed.data.type,
        itemId: parsed.data.itemId,
        lotId: parsed.data.lotId,
        qty: parsed.data.qty,
        reason: parsed.data.reason,
        actor: user?.id ?? "local-user",
        createdAt: now,
      };

      const currentLots = Object.values(useLotsStore.getState().lots as any);
      const nextLots = applyMovementToLots(currentLots, movement);
      replaceMany(nextLots);
      pushMovement(movement);

      return movement;
    },
    [replaceMany, pushMovement, user, wsId, can]
  );
}
