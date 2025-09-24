// src/services/membershipService.ts
import type { WorkspaceRole } from "@/stores/workspaceStore";

export const rolePriority: Record<WorkspaceRole, number> = {
  owner: 3,
  admin: 2,
  member: 1,
  viewer: 0,
};

export function getEffectiveRole(role: WorkspaceRole | null): WorkspaceRole {
  return role ?? "viewer";
}

export type Permission = "manageUsers" | "edit" | "view";

export function can(role: WorkspaceRole | null, perm: Permission): boolean {
  const r = getEffectiveRole(role);
  if (perm === "manageUsers") return r === "owner" || r === "admin";
  if (perm === "edit") return r === "owner" || r === "admin" || r === "member";
  return true;
}

export function isOwner(role: WorkspaceRole | null) {
  return getEffectiveRole(role) === "owner";
}
