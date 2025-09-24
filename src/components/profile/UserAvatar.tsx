// src/components/profile/UserAvatar.tsx
import React from "react";
import type { AuthUser } from "@/stores/authStore";

type Props = { user: AuthUser | null; size?: number };

export const UserAvatar: React.FC<Props> = React.memo(({ user, size = 32 }) => {
  const initials =
    user?.name
      ?.trim()
      .split(/\s+/)
      .map((s) => s[0]?.toUpperCase())
      .slice(0, 2)
      .join("") || "U";

  if (user?.avatarUrl) {
    return (
      <img
        src={user.avatarUrl}
        alt={user.name || user.email}
        width={size}
        height={size}
        className="rounded-full object-cover"
      />
    );
  }

  return (
    <div
      style={{ width: size, height: size }}
      className="rounded-full bg-gray-200 text-gray-700 flex items-center justify-center text-sm font-medium"
      aria-label={user?.name || user?.email || "User"}
    >
      {initials}
    </div>
  );
});
