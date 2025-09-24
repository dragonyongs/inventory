// src/hooks/useMembership.ts
import { useAuthStore } from "@/stores/authStore";
import { useWorkspaceStore, WorkspaceRole } from "@/stores/workspaceStore";
import {
  getEffectiveRole,
  can as canFn,
  isOwner as isOwnerFn,
  Permission,
} from "@/services/membershipService";

export function useMembership() {
  const user = useAuthStore((s) => s.user);
  const workspaceId = useWorkspaceStore((s) => s.currentWorkspaceId);
  const getUserRole = useWorkspaceStore((s) => s.getUserRole);

  const rawRole =
    workspaceId && user
      ? (getUserRole(workspaceId, user.id) as WorkspaceRole | null)
      : null;
  const role = getEffectiveRole(rawRole);

  return {
    user,
    workspaceId,
    role,
    can: (perm: Permission) => canFn(rawRole, perm),
    isOwner: isOwnerFn(rawRole),
  };
}
