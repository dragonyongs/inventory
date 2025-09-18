// src/hooks/useOnlineSync.ts
import { useEffect } from "react";
import { useAuthStore } from "@/stores/auth";
import { useWorkspaceStore } from "@/stores/workspace";
import { useOutboxStoreFactory } from "@/stores/outbox";

export function useOnlineSync() {
  const userId = useAuthStore((s) => s.user?.id);
  const wsId = useWorkspaceStore((s) => s.activeWsId);

  useEffect(() => {
    if (!userId || !wsId) return;
    const useOutbox = useOutboxStoreFactory(userId, wsId);
    const tryFlush = () => {
      useOutbox.getState().flush({ userId, workspaceId: wsId });
    };

    const onOnline = () => tryFlush();
    const onVisible = () => {
      if (document.visibilityState === "visible") tryFlush();
    };

    window.addEventListener("online", onOnline);
    document.addEventListener("visibilitychange", onVisible);

    // initial attempt
    tryFlush();

    return () => {
      window.removeEventListener("online", onOnline);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [userId, wsId]);
}
