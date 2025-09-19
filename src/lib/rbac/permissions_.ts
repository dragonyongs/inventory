// src/lib/rbac/permissions.ts
export type Role = "owner" | "editor" | "viewer" | "guest";

export type Permission =
  | "items:view"
  | "items:edit"
  | "lots:view"
  | "lots:edit"
  | "movements:view"
  | "movements:create"
  | "movements:delete";

const rolePermissions: Record<Role, Permission[]> = {
  owner: [
    "items:view",
    "items:edit",
    "lots:view",
    "lots:edit",
    "movements:view",
    "movements:create",
    "movements:delete",
  ],
  editor: [
    "items:view",
    "items:edit",
    "lots:view",
    "lots:edit",
    "movements:view",
    "movements:create",
  ],
  viewer: ["items:view", "lots:view", "movements:view"],
  guest: [],
};

export function hasPermission(role: Role, perm: Permission) {
  return rolePermissions[role]?.includes(perm) ?? false;
}

export function canAccessPage(role: Role, page: "view" | "edit") {
  if (page === "view")
    return (
      hasPermission(role, "items:view") && hasPermission(role, "movements:view")
    );
  if (page === "edit")
    return (
      hasPermission(role, "items:edit") &&
      hasPermission(role, "movements:create")
    );
  return false;
}
