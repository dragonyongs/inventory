import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";

import type { Permission } from "@/lib/rbac/permissions"; // FIX: type-only
import { useAuthStore } from "@/stores/authStore"; // FIX: 경로 수정
import { useWorkspaceStore } from "@/stores/workspaceStore"; // FIX: 경로 수정

interface RequirePermissionProps {
  permission: Permission;
  children: ReactNode;
  fallback?: ReactNode | null;
}

export function RequirePermission({
  permission,
  children,
  fallback = null,
}: RequirePermissionProps) {
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const currentRole = useWorkspaceStore((s) => {
    const ws = s.workspaces.find((w) => w.id === s.currentId);
    return ws?.members.find((m) => m.userId === user?.id)?.role ?? null;
  });

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // TODO: 실제 RBAC 확인: permission과 currentRole로 판정
  const hasPermission = !!currentRole && !!permission;

  if (!hasPermission) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
