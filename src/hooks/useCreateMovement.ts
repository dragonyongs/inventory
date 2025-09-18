import { useLotsStore } from "../stores/lotsStore";
import { useMovementsStore } from "../stores/movementsStore";
import type { Movement } from "../types/domain";
import { applyMovementToLots } from "../utils/applyMovement";

export function useCreateMovement() {
  const getLots = () => Object.values(useLotsStore.getState().lots);
  const replaceMany = useLotsStore((s) => s.replaceMany);
  const pushMovement = useMovementsStore((s) => s.push);

  return (m: Movement) => {
    const nextLots = applyMovementToLots(getLots(), m);
    replaceMany(nextLots);
    pushMovement(m);
  };
}
