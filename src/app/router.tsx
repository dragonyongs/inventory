// src/app/router.tsx - 완전 수정
import { createBrowserRouter, Navigate, Outlet } from "react-router-dom";
import { RouterProvider } from "react-router-dom"; // ✅ 별도 import로 명확하게
import { Component, ReactNode } from "react";

// 레이아웃 & 페이지
import { RootLayout } from "../components/RootLayout";
import { AuthGuard } from "../components/AuthGuard";
import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";
import Inventory from "../pages/Inventory";
import Movements from "../pages/Movements";
import Settings from "../pages/Settings";
import { NewItemPage } from "@/pages/inventory/NewItemPage";
import { BulkImportPage } from "@/pages/inventory/BulkImportPage";

// 강화된 Error Boundary
class RouteErrorBoundary extends Component<
  { children: ReactNode; fallback?: ReactNode },
  { hasError: boolean; error?: Error; errorInfo?: any }
> {
  constructor(props: { children: ReactNode; fallback?: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    console.error("❌ Router Error:", error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("❌ Router Error Details:", { error, errorInfo });
    this.setState({ errorInfo });
  }

  handleReload = () => {
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full text-center">
            <div className="mb-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-gray-900 mb-2">
                애플리케이션 오류
              </h1>
              <p className="text-gray-600 text-sm mb-4">
                예상치 못한 오류가 발생했습니다. 페이지를 새로고침해 주세요.
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={this.handleReload}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                페이지 새로고침
              </button>

              <button
                onClick={() => (window.location.href = "/login")}
                className="w-full px-4 py-2 text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50 transition-colors"
              >
                로그인 페이지로
              </button>
            </div>

            {/* 개발 환경에서만 상세 오류 표시 */}
            {import.meta.env.DEV && this.state.error && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-sm text-gray-500">
                  오류 상세보기
                </summary>
                <pre className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded overflow-auto">
                  {this.state.error.message}
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// 보호된 레이아웃 컴포넌트 (기존과 동일하게 유지)
function ProtectedLayout() {
  return (
    <RouteErrorBoundary>
      <AuthGuard>
        <RootLayout>
          <Outlet />
        </RootLayout>
      </AuthGuard>
    </RouteErrorBoundary>
  );
}

// 404 페이지 컴포넌트
function NotFound({ error }: { error?: any }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-300">404</h1>
        <p className="text-xl text-gray-600 mt-4">
          {error
            ? "페이지에서 오류가 발생했습니다"
            : "페이지를 찾을 수 없습니다"}
        </p>
        <div className="mt-6 space-x-4">
          <button
            onClick={() => (window.location.href = "/dashboard")}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            대시보드로 돌아가기
          </button>
          <button
            onClick={() => (window.location.href = "/login")}
            className="px-4 py-2 text-blue-600 border border-blue-600 rounded hover:bg-blue-50"
          >
            로그인 페이지로
          </button>
        </div>

        {/* 개발 환경에서만 오류 상세정보 표시 */}
        {import.meta.env.DEV && error && (
          <details className="mt-6 text-left max-w-2xl mx-auto">
            <summary className="cursor-pointer text-sm text-gray-500">
              오류 상세보기
            </summary>
            <pre className="mt-2 text-xs text-red-600 bg-red-50 p-4 rounded overflow-auto">
              {JSON.stringify(error, null, 2)}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}

// ✅ 라우터 설정 (변수명 변경하여 충돌 방지)
const appRouter = createBrowserRouter([
  // 로그인 페이지
  {
    path: "/login",
    element: (
      <RouteErrorBoundary>
        <Login />
      </RouteErrorBoundary>
    ),
    errorElement: <NotFound />,
  },

  // 보호된 라우트들
  {
    path: "/",
    element: <ProtectedLayout />,
    errorElement: <NotFound />,
    children: [
      // 메인 페이지 → 대시보드로 리다이렉트
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: "dashboard", element: <Dashboard /> },
      { path: "inventory", element: <Inventory /> },
      { path: "movements", element: <Movements /> },
      { path: "settings", element: <Settings /> },
      { path: "/inventory/new", element: <NewItemPage /> },
      { path: "/inventory/bulk", element: <BulkImportPage /> },
    ],
  },

  // 404 처리
  {
    path: "*",
    element: <NotFound />,
  },
]);

// ✅ 기존 방식과 호환되는 default export (AppRouter 컴포넌트)
export default function AppRouter() {
  try {
    return <RouterProvider router={appRouter} />;
  } catch (error) {
    console.error("❌ RouterProvider 오류:", error);
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">라우터 오류</h1>
          <p className="text-gray-600 mb-4">
            라우팅 시스템을 불러올 수 없습니다.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            새로고침
          </button>
        </div>
      </div>
    );
  }
}

// ✅ router 객체를 다른 이름으로 export (충돌 방지)
export { appRouter as router };
