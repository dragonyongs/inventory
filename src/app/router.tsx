// src/app/router.tsx
import { Suspense, lazy } from "react";
import {
  createBrowserRouter,
  Navigate,
  RouterProvider,
} from "react-router-dom";
import { AuthLayout } from "@/components/AuthLayout";
import { ProtectedLayout } from "@/components/ProtectedLayout";

const Login = lazy(() => import("@/pages/Login"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Inventory = lazy(() => import("@/pages/Inventory"));
const Movements = lazy(() => import("@/pages/Movements"));
const Settings = lazy(() => import("@/pages/Settings"));
const SharedInventory = lazy(() => import("@/pages/SharedInventory"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const NewItemPage = lazy(() =>
  import("@/components/inventory/NewItemPage").then((m) => ({
    default: m.NewItemPage,
  }))
);
const BulkImportPage = lazy(() =>
  import("@/pages/BulkImportPage").then((m) => ({
    default: m.BulkImportPage,
  }))
);

const PageLoader = () => (
  <div className="min-h-screen grid place-items-center text-gray-600">
    불러오는 중…
  </div>
);

const router = createBrowserRouter([
  // ============================================
  // 공개 라우트 (인증 불필요)
  // ============================================
  {
    path: "/login",
    element: (
      <AuthLayout>
        <Suspense fallback={<PageLoader />}>
          <Login />
        </Suspense>
      </AuthLayout>
    ),
  },
  // ✅ 공유 페이지 라우트 (인증 불필요, ProtectedLayout 외부)
  {
    path: "/share/:token",
    element: (
      <Suspense fallback={<PageLoader />}>
        <SharedInventory />
      </Suspense>
    ),
  },

  // ============================================
  // 보호된 라우트 (인증 필요)
  // ============================================
  {
    element: <ProtectedLayout />,
    children: [
      // 루트 리다이렉션
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      // 대시보드
      {
        path: "/dashboard",
        element: (
          <Suspense fallback={<PageLoader />}>
            <Dashboard />
          </Suspense>
        ),
      },
      // 재고 관리
      {
        path: "/inventory",
        element: (
          <Suspense fallback={<PageLoader />}>
            <Inventory />
          </Suspense>
        ),
      },
      {
        path: "/inventory/new",
        element: (
          <Suspense fallback={<PageLoader />}>
            <NewItemPage />
          </Suspense>
        ),
      },
      {
        path: "/inventory/bulk",
        element: (
          <Suspense fallback={<PageLoader />}>
            <BulkImportPage />
          </Suspense>
        ),
      },
      // 입출고 내역
      {
        path: "/movements",
        element: (
          <Suspense fallback={<PageLoader />}>
            <Movements />
          </Suspense>
        ),
      },
      // 설정
      {
        path: "/settings",
        element: (
          <Suspense fallback={<PageLoader />}>
            <Settings />
          </Suspense>
        ),
      },
    ],
  },

  // ============================================
  // 404 Not Found (모든 매칭 안 된 경로)
  // ============================================
  {
    path: "*",
    element: (
      <Suspense fallback={<PageLoader />}>
        <NotFound />
      </Suspense>
    ),
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
