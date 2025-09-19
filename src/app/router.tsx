// src/app/router.tsx

import {
  createBrowserRouter,
  RouterProvider,
  useRouteError,
  Outlet,
} from "react-router-dom";

// 레이아웃 & 페이지
import { RootLayout } from "../components/RootLayout";
import { AuthGuard } from "../components/AuthGuard";
import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";
import Inventory from "../pages/Inventory";
import Movements from "../pages/Movements";
import Settings from "../pages/Settings";
import NotFound from "../pages/NotFound";

function RouteErrorBoundary() {
  const err = useRouteError() as any;
  console.error("Router Error:", err);
  return <NotFound error={err} />;
}

// 보호된 레이아웃 컴포넌트
function ProtectedLayout() {
  return (
    <AuthGuard>
      <RootLayout>
        <Outlet />
      </RootLayout>
    </AuthGuard>
  );
}

// 라우터 정의
const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/",
    element: <ProtectedLayout />, // 보호된 레이아웃
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        index: true, // "/" 경로
        element: <Dashboard />,
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
    path: "*",
    element: <NotFound />,
  },
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}
