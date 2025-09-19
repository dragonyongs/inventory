import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";

import { Permission } from "@/lib/rbac/permissions";
import useAuthStore, { type Store as AuthStore } from "@/stores/auth";
import useWorkspaceStore, {
  type Store as WorkspaceStore,
} from "@/stores/workspace";

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
  const user = useAuthStore((s: AuthStore) => s.user);
  const currentRole = useWorkspaceStore((s: WorkspaceStore) => s.currentRole);

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // NOTE: 실제 RBAC(역할 기반 접근 제어) 로직은 여기서 구현되어야 합니다.
  // 이 예시에서는 단순히 역할이 있는지 여부만 확인합니다.
  const hasPermission = !!currentRole; // TODO: 실제 권한 확인 로직으로 교체

  if (!hasPermission) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
