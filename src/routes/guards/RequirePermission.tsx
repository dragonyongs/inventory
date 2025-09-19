// src/routes/guards/RequirePermission.tsx

import { ReactNode } from "react";
import { useWorkspaceStore } from "../../stores/workspaceStore";
import { useAuthStore } from "../../stores/authStore";

interface RequirePermissionProps {
  children: ReactNode;
  permission: "read" | "write" | "admin";
  fallback?: ReactNode;
}

export default function RequirePermission({
  children,
  permission,
  fallback = (
    <div className="text-center text-gray-500 py-8">권한이 없습니다.</div>
  ),
}: RequirePermissionProps) {
  const { user } = useAuthStore();
  const currentWorkspaceId = useWorkspaceStore((s) => s.currentWorkspaceId); // ✅ 올바른 속성명
  const getUserRole = useWorkspaceStore((s) => s.getUserRole);

  // 사용자 인증 확인
  if (!user) {
    return fallback;
  }

  // 현재 워크스페이스 확인
  if (!currentWorkspaceId) {
    return fallback;
  }

  // 사용자 권한 확인
  const userRole = getUserRole(currentWorkspaceId, user.id);
  if (!userRole) {
    return fallback;
  }

  // 권한 체크 로직
  const hasPermission = checkPermission(userRole, permission);

  return hasPermission ? <>{children}</> : fallback;
}

// 권한 체크 헬퍼 함수
function checkPermission(
  userRole: "owner" | "admin" | "member" | "viewer",
  requiredPermission: "read" | "write" | "admin"
): boolean {
  const roleHierarchy = {
    owner: 4,
    admin: 3,
    member: 2,
    viewer: 1,
  };

  const permissionRequirements = {
    read: 1, // viewer 이상
    write: 2, // member 이상
    admin: 3, // admin 이상
  };

  return roleHierarchy[userRole] >= permissionRequirements[requiredPermission];
}
