// src/hooks/useMembership.ts
import { useEffect } from "react";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { useAuthStore } from "@/stores/authStore";
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
  const claimOwnerIfMissing = useWorkspaceStore(
    (s) => (s as any).claimOwnerIfMissing
  );

  const rawRole =
    workspaceId && user ? getUserRole(workspaceId, user.id) ?? null : null;

  useEffect(() => {
    if (workspaceId && user && !rawRole) {
      claimOwnerIfMissing?.(workspaceId, user.id); // ← 최초 진입 시 자동 보정
    }
  }, [workspaceId, user?.id, rawRole, claimOwnerIfMissing]);
  const role = getEffectiveRole(rawRole);

  return {
    user,
    workspaceId,
    role,
    can: (perm: Permission) => canFn(rawRole, perm),
    isOwner: isOwnerFn(rawRole),
  };
}
