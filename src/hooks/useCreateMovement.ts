import { MovementInputSchema } from "../types/schemas";
import type { MovementInput } from "../types/schemas";
import type { Movement } from "../types/domain";
import { applyMovementToLots } from "../utils/applyMovement";
import { useLotsStore } from "../stores/lotsStore";
import { useMovementsStore } from "../stores/movementsStore";
import { useAuthStore } from "../stores/authStore";
import { useWorkspaceStore } from "../stores/workspaceStore";

export function useCreateMovement() {
  const getLots = () => Object.values(useLotsStore.getState().lots);
  const replaceMany = useLotsStore((s) => s.replaceMany);
  const pushMovement = useMovementsStore((s) => s.push);
  const userId = useAuthStore((s) => s.user?.id);
  const wsId = useWorkspaceStore((s) => s.currentId);
  const can = useWorkspaceStore(
    (s) => (id: string, a: "edit" | "view" | "delete") => s.can(id, a)
  );

  return (input: MovementInput) => {
    if (!wsId || !can(wsId, "edit")) throw new Error("No permission");

    const parsed = MovementInputSchema.safeParse(input);
    if (!parsed.success)
      throw new Error(parsed.error.issues.map((i) => i.message).join(", "));

    const now = new Date().toISOString();
    const m: Movement = {
      id: crypto.randomUUID(),
      createdAt: now,
      actor: userId ?? "unknown",
      ...parsed.data,
    };

    const nextLots = applyMovementToLots(getLots(), m);
    replaceMany(nextLots);
    pushMovement(m);
    return m;
  };
}
