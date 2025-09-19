// src/components/AuthGuard.tsx

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import { Package } from "lucide-react";

interface AuthGuardProps {
  children: React.ReactNode;
}

export const AuthGuard = ({ children }: AuthGuardProps) => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  // 로딩 중일 때 더 나은 UI
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4 animate-pulse">
            <Package className="w-8 h-8 text-white" />
          </div>
          <div className="text-lg font-medium text-gray-900 mb-2">
            로그인 확인 중...
          </div>
          <div className="text-sm text-gray-500">잠시만 기다려주세요</div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
