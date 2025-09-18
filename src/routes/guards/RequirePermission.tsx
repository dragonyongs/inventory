// src/routes/guards/RequirePermission.tsx
import { ReactNode, useMemo } from "react";
import { useParams, useLocation, Navigate } from "react-router-dom";
import { canAccessPage } from "@/lib/rbac/permissions";
import { useAuthStore } from "@/stores/auth"; // role, user, workspaces in state
import { useWorkspaceStore } from "@/stores/workspace"; // active workspace id

type Props = {
  page: "view" | "edit";
  children: ReactNode;
  fallback?: string; // e.g. "/app/:wsId/readonly"
};

export default function RequirePermission({ page, children, fallback }: Props) {
  const { wsId: wsIdFromParams } = useParams();
  const { pathname } = useLocation();
  const role = useAuthStore(
    (s) => s.roleByWsId[wsIdFromParams ?? s.activeWsId] ?? "guest"
  );
  const wsId = useWorkspaceStore((s) => s.activeWsId ?? wsIdFromParams);

  const allowed = useMemo(() => canAccessPage(role, page), [role, page]);

  if (!wsId) {
    // route param missing or workspace not selected, go to a safe landing
    return <Navigate to="/workspaces" replace state={{ from: pathname }} />;
  }

  if (!allowed) {
    // Route-level guard: diverge to an error path (handled by errorElement)
    // Throwing a Response allows errorElement to render a friendly screen
    throw new Response("Forbidden", { status: 403, statusText: "Forbidden" });
  }

  return <>{children}</>;
}
