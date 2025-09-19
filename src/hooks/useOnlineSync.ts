// src/hooks/useOnlineSync.ts
import { useEffect } from "react";
import { useOutboxStore } from "../stores/outboxStore";
import { useWorkspaceStore } from "../stores/workspaceStore";
import { useAuthStore } from "../stores/authStore";

export function useOnlineSync() {
  const userId = useAuthStore((s) => s.user?.id);
  const wsId = useWorkspaceStore((s) => s.currentId); // activeWsId -> currentId

  useEffect(() => {
    if (!userId || !wsId) return;

    const tryFlush = () => {
      useOutboxStore.getState().flush({ userId, workspaceId: wsId });
    };

    const onOnline = () => tryFlush();
    const onVisible = () => {
      if (document.visibilityState === "visible") tryFlush();
    };

    window.addEventListener("online", onOnline);
    document.addEventListener("visibilitychange", onVisible);

    tryFlush();

    return () => {
      window.removeEventListener("online", onOnline);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [userId, wsId]);
}
