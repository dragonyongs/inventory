import { createJSONStorage, persist } from "zustand/middleware";
import type { PersistOptions } from "zustand/middleware";
import type { StateCreator } from "zustand";
import { useAuthStore } from "./authStore";
import { useWorkspaceStore } from "./workspaceStore";

export function makeNsName(base: string) {
  const u = useAuthStore.getState().user?.id ?? "anon";
  const ws = useWorkspaceStore.getState().currentId ?? "default";
  return `inv:${u}:${ws}:${base}`;
}

export function nsPersist<T extends object>(
  base: string,
  opts?: Omit<PersistOptions<T>, "name" | "storage"> & { storage?: Storage }
) {
  return (config: StateCreator<T, [], []>): StateCreator<T, [], []> =>
    persist<T>(config, {
      name: makeNsName(base),
      storage: createJSONStorage(() => opts?.storage ?? localStorage),
      ...(opts as any),
    } as PersistOptions<T>);
}

// 각 스토어에서 사용 시: create(nsPersist('items', { partialize: ... })(storeCreator))
