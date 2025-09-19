// src/routes/guards/RequirePermission.tsx
import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import type { Permission } from "../../lib/rbac/permissions";
import { useAuthStore, type User } from "../../stores/authStore";
import { useWorkspaceStore, type Workspace } from "../../stores/workspaceStore";

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
  const user = useAuthStore((s: { user: User | null }) => s.user);
  const currentRole = useWorkspaceStore(
    (s: { workspaces: Workspace[]; currentId: string | null }) => {
      const ws = s.workspaces.find((w: Workspace) => w.id === s.currentId);
      return (
        ws?.members.find(
          (m: { userId: string; role: string }) => m.userId === user?.id
        )?.role ?? null
      );
    }
  );

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
