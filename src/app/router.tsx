// src/app/router.tsx
import { createBrowserRouter, Navigate } from "react-router-dom";
import { RouterProvider } from "react-router-dom";
import { Component, ReactNode, Suspense, lazy } from "react";

// 레이아웃 & 인증 가드는 즉시 로드
import { RootLayout } from "@/components/RootLayout";
import { AuthGuard } from "@/components/AuthGuard";

// ========== Lazy Loading 페이지 ==========
const Login = lazy(() => import("@/pages/Login"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Inventory = lazy(() => import("@/pages/Inventory"));
const Movements = lazy(() => import("@/pages/Movements"));
const Settings = lazy(() => import("@/pages/Settings"));
const SharedInventory = lazy(() => import("@/pages/SharedInventory"));

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

// ========== 로딩 Fallback ==========
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-lg">로딩 중...</div>
  </div>
);

// ========== Error Boundary ==========
class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <h2 className="text-xl font-bold mb-4">문제가 발생했습니다</h2>
          <p className="mb-4">페이지를 새로고침해 주세요.</p>
          {import.meta.env.DEV && this.state.error && (
            <pre className="text-sm bg-gray-100 p-4 rounded overflow-auto max-w-full">
              {this.state.error.stack}
            </pre>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}

// ========== 라우터 정의 ==========
const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <ErrorBoundary>
        <Suspense fallback={<PageLoader />}>
          <RootLayout />
        </Suspense>
      </ErrorBoundary>
    ),
    children: [
      // 인증 불필요 페이지
      {
        path: "login",
        element: (
          <Suspense fallback={<PageLoader />}>
            <Login />
          </Suspense>
        ),
      },
      {
        path: "shared/:sharedId",
        element: (
          <Suspense fallback={<PageLoader />}>
            <SharedInventory />
          </Suspense>
        ),
      },
      // ✅ 인증 필요 페이지 (AuthGuard가 Outlet 반환)
      {
        element: <AuthGuard />,
        children: [
          { index: true, element: <Navigate to="/dashboard" replace /> },
          {
            path: "dashboard",
            element: (
              <Suspense fallback={<PageLoader />}>
                <Dashboard />
              </Suspense>
            ),
          },
          {
            path: "inventory",
            children: [
              {
                index: true,
                element: (
                  <Suspense fallback={<PageLoader />}>
                    <Inventory />
                  </Suspense>
                ),
              },
              {
                path: "new",
                element: (
                  <Suspense fallback={<PageLoader />}>
                    <NewItemPage />
                  </Suspense>
                ),
              },
              {
                path: "bulk-import",
                element: (
                  <Suspense fallback={<PageLoader />}>
                    <BulkImportPage />
                  </Suspense>
                ),
              },
            ],
          },
          {
            path: "movements",
            element: (
              <Suspense fallback={<PageLoader />}>
                <Movements />
              </Suspense>
            ),
          },
          {
            path: "settings",
            element: (
              <Suspense fallback={<PageLoader />}>
                <Settings />
              </Suspense>
            ),
          },
        ],
      },
      // 404
      {
        path: "*",
        element: (
          <div className="flex flex-col items-center justify-center min-h-screen">
            <h1 className="text-2xl font-bold mb-4">404</h1>
            <p>페이지를 찾을 수 없습니다</p>
          </div>
        ),
      },
    ],
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
