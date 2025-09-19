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
  fallback = <div>권한이 없습니다.</div>,
}: RequirePermissionProps) {
  const user = useAuthStore((s) => s.user);
  const workspaces = useWorkspaceStore((s) => s.workspaces); // 올바른 selector 사용
  const currentWorkspaceId = useWorkspaceStore((s) => s.currentWorkspaceId); // currentId → currentWorkspaceId

  if (!user || !currentWorkspaceId) {
    return <>{fallback}</>;
  }

  const workspace = workspaces.find((ws) => ws.id === currentWorkspaceId);
  if (!workspace || !workspace.members) {
    // members 속성 체크 추가
    return <>{fallback}</>;
  }

  const member = workspace.members.find((m) => m.userId === user.id);
  if (!member) {
    return <>{fallback}</>;
  }

  // 권한 체크 로직
  const hasPermission = () => {
    switch (permission) {
      case "admin":
        return member.role === "owner" || member.role === "admin";
      case "write":
        return member.role !== "viewer";
      case "read":
        return true; // 모든 멤버는 읽기 권한 있음
      default:
        return false;
    }
  };

  return hasPermission() ? <>{children}</> : <>{fallback}</>;
}
