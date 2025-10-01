// src/pages/Login.tsx

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import { useGoogleAuth } from "../hooks/useGoogleAuth";
import { Package, Sparkles } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { signInWithGoogle, isLoading } = useGoogleAuth();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error("로그인 실패:", error);
    }
  };

  return (
    <div className="max-w-md w-full">
      {/* 로고 & 브랜딩 */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
          <Package className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          재고관리 마스터
        </h1>
        <p className="text-gray-600">간편하고 효율적인 재고 관리 솔루션</p>
      </div>

      {/* 로그인 카드 */}
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">시작하기</h2>
          <p className="text-gray-600 text-sm">
            구글 계정으로 간편하게 로그인하세요
          </p>
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mr-3" />
          ) : (
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
          )}
          구글로 로그인
        </button>

        {/* 기능 미리보기 */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-900 mb-3">주요 기능</h3>
          <div className="space-y-2">
            {[
              "실시간 재고 추적",
              "입출고 이력 관리",
              "만료일 알림",
              "다중 워크스페이스",
            ].map((feature, index) => (
              <div
                key={index}
                className="flex items-center text-sm text-gray-600"
              >
                <Sparkles className="w-4 h-4 text-blue-500 mr-2" />
                {feature}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
