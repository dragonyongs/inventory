// src/components/profile/RoleBadge.tsx
import React from "react";
import type { WorkspaceRole } from "@/stores/workspaceStore";

type Props = { role: WorkspaceRole };

const COLOR: Record<WorkspaceRole, string> = {
  owner: "bg-yellow-100 text-yellow-800",
  admin: "bg-purple-100 text-purple-800",
  member: "bg-blue-100 text-blue-800",
  viewer: "bg-gray-100 text-gray-700",
};

export const RoleBadge: React.FC<Props> = React.memo(({ role }) => {
  return (
    <span
      className={`px-2 py-0.5 rounded text-xs ${COLOR[role]}`}
      aria-label={`role-${role}`}
    >
      {role}
    </span>
  );
});
