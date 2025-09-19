// src/pages/NotFound.tsx
import { Link, useLocation } from "react-router-dom";
import { Home, ArrowLeft, Search, AlertTriangle, Bug } from "lucide-react";

interface NotFoundProps {
  error?: {
    status?: number;
    statusText?: string;
    message?: string;
    data?: any;
  };
}

export default function NotFound({ error }: NotFoundProps) {
  const location = useLocation();

  const isRouteError = !!error;
  const errorStatus = error?.status;
  const errorMessage = error?.message || error?.statusText;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center">
        {/* 에러 아이콘 */}
        <div className="mb-8">
          <div
            className={`mx-auto w-24 h-24 rounded-full flex items-center justify-center ${
              isRouteError ? "bg-red-100" : "bg-orange-100"
            }`}
          >
            {isRouteError ? (
              <Bug className="w-12 h-12 text-red-600" />
            ) : (
              <AlertTriangle className="w-12 h-12 text-orange-600" />
            )}
          </div>
        </div>

        {/* 에러 메시지 */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {errorStatus || "404"}
          </h1>
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">
            {isRouteError ? "오류가 발생했습니다" : "페이지를 찾을 수 없습니다"}
          </h2>
          <p className="text-gray-600 mb-2">
            {isRouteError
              ? "애플리케이션에서 예상치 못한 오류가 발생했습니다."
              : "요청하신 페이지가 존재하지 않거나 이동되었습니다."}
          </p>

          {/* 상세 에러 정보 */}
          <div className="bg-gray-100 rounded-lg p-4 mt-6 mb-8">
            {errorMessage && (
              <div className="flex items-center justify-center text-sm mb-2">
                <span className="text-gray-500 mr-2">오류 메시지:</span>
                <code className="bg-red-100 px-2 py-1 rounded font-mono text-red-800">
                  {errorMessage}
                </code>
              </div>
            )}
            <div className="flex items-center justify-center text-sm">
              <span className="text-gray-500 mr-2">경로:</span>
              <code className="bg-gray-200 px-2 py-1 rounded font-mono text-gray-800">
                {location.pathname}
              </code>
            </div>
          </div>
        </div>

        {/* 액션 버튼들 */}
        <div className="space-y-4">
          <Link
            to="/"
            className="inline-flex items-center justify-center w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Home className="w-5 h-5 mr-2" />
            홈으로 돌아가기
          </Link>

          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center w-full px-6 py-3 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            이전 페이지로
          </button>

          {isRouteError && (
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center justify-center w-full px-6 py-3 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 transition-colors"
            >
              <Search className="w-5 h-5 mr-2" />
              페이지 새로고침
            </button>
          )}
        </div>

        {/* 도움말 링크들 */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            다른 페이지를 찾고 계신가요?
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              to="/inventory"
              className="flex items-center justify-center p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors group"
            >
              <Search className="w-5 h-5 text-gray-600 group-hover:text-blue-600 mr-2" />
              <span className="font-medium text-gray-700 group-hover:text-blue-700">
                인벤토리
              </span>
            </Link>

            <Link
              to="/movements"
              className="flex items-center justify-center p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors group"
            >
              <Search className="w-5 h-5 text-gray-600 group-hover:text-blue-600 mr-2" />
              <span className="font-medium text-gray-700 group-hover:text-blue-700">
                이동내역
              </span>
            </Link>
          </div>
        </div>

        {/* 추가 도움말 */}
        <div className="mt-8 text-sm text-gray-500">
          <p>문제가 지속되면 관리자에게 문의해주세요.</p>
          {isRouteError && (
            <p className="mt-2 text-xs">
              오류 ID: {Date.now().toString(36)} - 이 정보를 관리자에게
              전달해주세요.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
