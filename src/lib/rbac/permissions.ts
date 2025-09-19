// src/lib/rbac/permissions.ts
export type Permission =
  | "items.read"
  | "items.write"
  | "items.delete"
  | "movements.read"
  | "movements.write"
  | "movements.delete"
  | "workspace.admin"
  | "workspace.member";

export const PERMISSIONS = {
  ITEMS_READ: "items.read" as const,
  ITEMS_WRITE: "items.write" as const,
  ITEMS_DELETE: "items.delete" as const,
  MOVEMENTS_READ: "movements.read" as const,
  MOVEMENTS_WRITE: "movements.write" as const,
  MOVEMENTS_DELETE: "movements.delete" as const,
  WORKSPACE_ADMIN: "workspace.admin" as const,
  WORKSPACE_MEMBER: "workspace.member" as const,
};
