// src/components/AuthGuard.tsx
import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";

type Props = { children?: React.ReactNode };

export const AuthGuard: React.FC<Props> = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated || !user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  }
  return <>{children ?? <Outlet />}</>;
};
