// src/components/AuthGuard.tsx (개선된 버전)
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import { Package, Loader2 } from "lucide-react";

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

  // 로딩 중일 때 개선된 UI
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

  return <>{children}</>;
};
