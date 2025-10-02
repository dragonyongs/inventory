import { roleOptions } from "../constants/workspace";

export function getRoleInfo(role: string | null) {
  if (!role) return roleOptions.guest;
  return roleOptions[role] || roleOptions.guest;
}
