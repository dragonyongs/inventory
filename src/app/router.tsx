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
const NewItemPage = lazy(() =>
  import("@/components/inventory/NewItemPage").then((m) => ({
    default: m.NewItemPage,
  }))
);
const BulkImportPage = lazy(() =>
  import("@/components/inventory/BulkImportPage").then((m) => ({
    default: m.BulkImportPage,
  }))
);

const PageLoader = () => (
  <div className="min-h-screen grid place-items-center text-gray-600">
    불러오는 중…
  </div>
);

const router = createBrowserRouter([
  // Public
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
  // Protected
  {
    element: <ProtectedLayout />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      {
        path: "/dashboard",
        element: (
          <Suspense fallback={<PageLoader />}>
            <Dashboard />
          </Suspense>
        ),
      },
      {
        path: "/inventory",
        element: (
          <Suspense fallback={<PageLoader />}>
            <Inventory />
          </Suspense>
        ),
      },
      {
        path: "/movements",
        element: (
          <Suspense fallback={<PageLoader />}>
            <Movements />
          </Suspense>
        ),
      },
      {
        path: "/settings",
        element: (
          <Suspense fallback={<PageLoader />}>
            <Settings />
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
        path: "/inventory/bulk-import",
        element: (
          <Suspense fallback={<PageLoader />}>
            <BulkImportPage />
          </Suspense>
        ),
      },
      {
        path: "/shared/:workspaceId",
        element: (
          <Suspense fallback={<PageLoader />}>
            <SharedInventory />
          </Suspense>
        ),
      },
    ],
  },
  {
    path: "*",
    element: (
      <div className="min-h-screen grid place-items-center">
        페이지를 찾을 수 없습니다
      </div>
    ),
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
