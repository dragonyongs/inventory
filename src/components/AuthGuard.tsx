// src/components/auth/AuthGuard.tsx

import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";

interface AuthGuardProps {
  children?: React.ReactNode;
}

export const AuthGuard = ({ children }: AuthGuardProps) => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const location = useLocation();

  if (!isAuthenticated) {
    // ✅ URL 파라미터를 /login에 그대로 전달
    const redirectTo = `/login${location.search}`;
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  return <>{children ?? <Outlet />}</>;
};
