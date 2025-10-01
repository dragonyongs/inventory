// src/app/router.tsx - Lazy Loading 적용 버전 (빌드 오류 완전 수정)
import { createBrowserRouter, Navigate, Outlet } from "react-router-dom";
import { RouterProvider } from "react-router-dom";
import { Component, ReactNode, Suspense, lazy } from "react";

// 레이아웃 & 인증 가드는 즉시 로드 (초기 구조 필수)
import { RootLayout } from "@/components/RootLayout";
import { AuthGuard } from "@/components/AuthGuard";

// ========== Lazy Loading 페이지 ==========
const Login = lazy(() => import("@/pages/Login"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Inventory = lazy(() => import("@/pages/Inventory"));
const Movements = lazy(() => import("@/pages/Movements"));
const Settings = lazy(() => import("@/pages/Settings"));
const SharedInventory = lazy(() => import("@/pages/SharedInventory"));

// 인벤토리 하위 페이지
const NewItemPage = lazy(() =>
  import("@/components/inventory/NewItemPage").then((mod) => ({
    default: mod.NewItemPage,
  }))
);
const BulkImportPage = lazy(() =>
  import("@/components/inventory/BulkImportPage").then((mod) => ({
    default: mod.BulkImportPage,
  }))
);

// ========== 로딩 Fallback 컴포넌트 ==========
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-50">
    <div className="flex flex-col items-center gap-3">
      <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-gray-600">로딩 중...</p>
    </div>
  </div>
);

// ========== 강화된 Error Boundary ==========
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
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <div className="max-w-md p-6 bg-white rounded-lg shadow-lg">
            <h2 className="mb-4 text-xl font-semibold text-red-600">
              예상치 못한 오류가 발생했습니다
            </h2>
            <p className="mb-4 text-sm text-gray-600">
              페이지를 새로고침해 주세요.
            </p>
            <button
              onClick={this.handleReload}
              className="w-full px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-600"
            >
              새로고침
            </button>
            {import.meta.env.DEV && this.state.error && (
              <details className="mt-4 text-xs">
                <summary className="cursor-pointer text-gray-500">
                  개발자 정보
                </summary>
                <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto">
                  {this.state.error.message}
                  {"\n\n"}
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

// ========== Protected Layout (Suspense 적용) ==========
const ProtectedLayout = () => {
  return (
    <RouteErrorBoundary>
      <AuthGuard>
        <RootLayout>
          <Suspense fallback={<PageLoader />}>
            <Outlet />
          </Suspense>
        </RootLayout>
      </AuthGuard>
    </RouteErrorBoundary>
  );
};

// ========== Shared Route Error Handling ==========
const SharedRouteErrorHandler = ({ error }: { error?: unknown }) => {
  // ✅ unknown 타입을 안전하게 처리
  const getErrorMessage = (err: unknown): string => {
    if (err instanceof Error) return err.message;
    if (typeof err === "string") return err;
    return "알 수 없는 오류";
  };

  const errorMessage = getErrorMessage(error);

  // ✅ error 존재 여부를 boolean으로 명시적 변환
  const hasError = error !== undefined && error !== null;

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="max-w-md p-6 bg-white rounded-lg shadow-lg text-center">
        <h2 className="mb-4 text-xl font-semibold text-red-600">
          {hasError
            ? "페이지에서 오류가 발생했습니다"
            : "페이지를 찾을 수 없습니다"}
        </h2>
        <p className="mb-4 text-sm text-gray-600">
          {hasError
            ? errorMessage
            : "링크가 유효하지 않거나 만료되었을 수 있습니다."}
        </p>
        {/* ✅ boolean 변수로 조건 체크 */}
        {import.meta.env.DEV && hasError ? (
          <details className="mt-4 text-xs text-left">
            <summary className="cursor-pointer text-gray-500">
              오류 상세
            </summary>
            <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto">
              {error instanceof Error
                ? error.stack
                : JSON.stringify(error, null, 2)}
            </pre>
          </details>
        ) : null}
      </div>
    </div>
  );
};

// ========== Router 정의 ==========
const router = createBrowserRouter([
  {
    path: "/login",
    element: (
      <RouteErrorBoundary>
        <Suspense fallback={<PageLoader />}>
          <Login />
        </Suspense>
      </RouteErrorBoundary>
    ),
  },
  {
    path: "/",
    element: <ProtectedLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: "dashboard",
        element: <Dashboard />,
      },
      {
        path: "inventory",
        element: <Inventory />,
      },
      {
        path: "inventory/new",
        element: <NewItemPage />,
      },
      {
        path: "inventory/bulk-import",
        element: <BulkImportPage />,
      },
      {
        path: "movements",
        element: <Movements />,
      },
      {
        path: "settings",
        element: <Settings />,
      },
    ],
  },
  {
    path: "/shared/:shareId",
    element: (
      <RouteErrorBoundary>
        <Suspense fallback={<PageLoader />}>
          <SharedInventory />
        </Suspense>
      </RouteErrorBoundary>
    ),
    errorElement: <SharedRouteErrorHandler />,
  },
  {
    path: "*",
    element: (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">404</h1>
          <p className="text-gray-600 mb-4">페이지를 찾을 수 없습니다</p>
          <a href="/" className="text-blue-500 hover:underline">
            홈으로 이동
          </a>
        </div>
      </div>
    ),
  },
]);

// ========== Router Provider Export ==========
export function AppRouter() {
  return (
    <RouteErrorBoundary>
      <RouterProvider router={router} />
    </RouteErrorBoundary>
  );
}
