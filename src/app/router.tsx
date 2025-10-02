import { Suspense, lazy } from "react";
import {
  createBrowserRouter,
  Navigate,
  RouterProvider,
} from "react-router-dom";
import { AuthLayout } from "@/components/AuthLayout";
import { ProtectedLayout } from "@/components/ProtectedLayout";

// ============================================
// Lazy-loaded Pages
// ============================================
const Login = lazy(() => import("@/pages/Login"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Inventory = lazy(() => import("@/pages/Inventory"));
const Movements = lazy(() => import("@/pages/Movements"));
const Settings = lazy(() => import("@/pages/Settings"));
const SharedInventory = lazy(() => import("@/pages/SharedInventory"));
const NotFound = lazy(() => import("@/pages/NotFound"));

// Inventory sub-pages
const NewItemPage = lazy(() =>
  import("@/components/inventory/NewItemPage").then((m) => ({
    default: m.NewItemPage,
  }))
);

// ✅ NEW: Feature-based BulkImportPage
const BulkImportPage = lazy(() =>
  import("@/pages/BulkImportPage").then((m) => ({
    default: m.BulkImportPage,
  }))
);

// ============================================
// Loading Fallback Component
// ============================================
const PageLoader = () => (
  <div className="min-h-screen grid place-items-center">
    <div className="text-center space-y-3">
      <div className="w-12 h-12 mx-auto border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
      <p className="text-sm text-gray-600">불러오는 중...</p>
    </div>
  </div>
);

// ============================================
// Router Configuration
// ============================================
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

      // ============================================
      // 재고 관리 라우트
      // ============================================
      {
        path: "/inventory",
        element: (
          <Suspense fallback={<PageLoader />}>
            <Inventory />
          </Suspense>
        ),
      },

      // 새 상품 등록
      {
        path: "/inventory/new",
        element: (
          <Suspense fallback={<PageLoader />}>
            <NewItemPage />
          </Suspense>
        ),
      },

      // ✅ 일괄 등록 (Feature-based)
      {
        path: "/inventory/bulk",
        element: (
          <Suspense fallback={<PageLoader />}>
            <BulkImportPage />
          </Suspense>
        ),
      },

      // ============================================
      // 입출고 내역
      // ============================================
      {
        path: "/movements",
        element: (
          <Suspense fallback={<PageLoader />}>
            <Movements />
          </Suspense>
        ),
      },

      // ============================================
      // 설정
      // ============================================
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

  // ✅ 공유 페이지 라우트 (인증 불필요, ProtectedLayout 외부)
  {
    path: "/share/workspace/:workspaceId",
    element: (
      <Suspense fallback={<PageLoader />}>
        <SharedInventory />
      </Suspense>
    ),
  },
  {
    path: "/share/:token",
    element: (
      <Suspense fallback={<PageLoader />}>
        <SharedInventory />
      </Suspense>
    ),
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

// ============================================
// Router Provider Component
// ============================================
export function AppRouter() {
  return <RouterProvider router={router} />;
}
