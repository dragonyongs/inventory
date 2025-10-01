// src/components/AuthGuard.tsx
import { Outlet } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import { Package, Loader2 } from "lucide-react";

export const AuthGuard = () => {
  const { isAuthenticated, user } = useAuthStore();

  // 로딩 중일 때 개선된 UI (기존 유지)
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center w-16 h-16 mx-auto bg-blue-100 rounded-full">
            {isAuthenticated ? (
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            ) : (
              <Package className="w-8 h-8 text-blue-600" />
            )}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {isAuthenticated ? "사용자 정보 로드 중..." : "인증이 필요합니다"}
            </h2>
            <p className="text-gray-600">
              {isAuthenticated
                ? "잠시만 기다려주세요..."
                : "로그인 페이지로 이동합니다..."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ✅ children 대신 Outlet으로 변경
  return <Outlet />;
};
