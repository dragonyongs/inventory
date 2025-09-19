import { createNamespacedMemory } from "./db/memoryAdapter.namespaced";
import { useWorkspaceStore } from "../stores/workspaceStore_";

const ns = createNamespacedMemory();

export function useInventoryService() {
  const wsId = useWorkspaceStore((s) => s.currentId)!;
  return ns.service(wsId);
}
