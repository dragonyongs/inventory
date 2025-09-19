// src/app/router.tsx
import {
  createBrowserRouter,
  RouterProvider,
  useRouteError,
} from "react-router-dom";

// 레이아웃 & 페이지
import { RootLayout } from "../components/RootLayout";
import Dashboard from "../pages/Dashboard";
import Inventory from "../pages/Inventory";
import Movements from "../pages/Movements";
import Settings from "../pages/Settings";
import NotFound from "../pages/NotFound";

// 라우트 에러 요소 (에러 정보 전달)
function RouteErrorBoundary() {
  const err = useRouteError() as any;
  console.error("Router Error:", err);

  // NotFound 컴포넌트에 에러 정보 전달
  return <NotFound error={err} />;
}

// 라우터 정의
const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        index: true,
        element: <Dashboard />,
        errorElement: <RouteErrorBoundary />,
      },
      {
        path: "inventory",
        element: <Inventory />,
        errorElement: <RouteErrorBoundary />,
      },
      {
        path: "movements",
        element: <Movements />,
        errorElement: <RouteErrorBoundary />,
      },
      {
        path: "settings",
        element: <Settings />,
        errorElement: <RouteErrorBoundary />,
      },
    ],
  },
  // 모든 경로에 대한 fallback
  {
    path: "*",
    element: <NotFound />,
  },
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}
