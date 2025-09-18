import { useLotsStore } from "../stores/lotsStore";
import { useMovementsStore } from "../stores/movementsStore";
import type { Movement } from "../types/domain";
import { applyMovementToLots } from "../utils/applyMovement";
import { MovementInputSchema } from "../types/schemas";
import type { MovementInput } from "../types/schemas";

export function useCreateMovement() {
  const getLots = () => Object.values(useLotsStore.getState().lots);
  const replaceMany = useLotsStore((s) => s.replaceMany);
  const pushMovement = useMovementsStore((s) => s.push);

  return (input: MovementInput) => {
    const parsed = MovementInputSchema.safeParse(input);
    if (!parsed.success) {
      const msg = parsed.error.issues.map((i) => i.message).join(", ");
      throw new Error(msg);
    }
    const now = new Date().toISOString();
    const m: Movement = {
      id: crypto.randomUUID(),
      createdAt: now,
      ...parsed.data,
    };
    const nextLots = applyMovementToLots(getLots(), m);
    replaceMany(nextLots);
    pushMovement(m);
    return m;
  };
}
