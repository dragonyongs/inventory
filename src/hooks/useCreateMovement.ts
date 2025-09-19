// src/hooks/useCreateMovement.ts
import { useCallback } from "react";
import { MovementInputSchema } from "../types/schemas";
import type { MovementInput } from "../types/schemas";
import type { Movement, Lot } from "../types/domain";
import { applyMovementToLots } from "../utils/applyMovement";
import { useLotsStore } from "../stores/lotsStore";
import { useMovementsStore } from "../stores/movementsStore";
import { useAuthStore } from "../stores/authStore";
import { useWorkspaceStore } from "../stores/workspaceStore_";

function makeId() {
  return (
    (globalThis.crypto as any)?.randomUUID?.() ??
    `mov_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  );
}

export function useCreateMovement() {
  const { replaceMany } = useLotsStore.getState();
  const { add: addMovement } = useMovementsStore.getState();
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

      const currentLots = Object.values(useLotsStore.getState().lots) as Lot[];
      const nextLots = applyMovementToLots(currentLots, movement);

      replaceMany(nextLots);

      // Movement 타입을 movementsStore의 Movement 타입에 맞게 변환
      const storeMovement = {
        id: movement.id,
        workspace_id: wsId,
        item_id: movement.itemId,
        type: movement.type as any,
        qty: movement.qty,
        reason: movement.reason,
        created_at: movement.createdAt,
      };

      addMovement(storeMovement);

      return movement;
    },
    [replaceMany, addMovement, user, wsId, can]
  );
}
