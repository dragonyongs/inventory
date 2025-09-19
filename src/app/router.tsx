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

// 라우트 에러 요소 (간단 버전)
function RouteErrorBoundary() {
  const err = useRouteError() as any;
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
      <pre className="text-sm text-red-600 whitespace-pre-wrap">
        {err?.status
          ? `${err.status} ${err.statusText}`
          : err?.message ?? "Unknown error"}
      </pre>
      <a href="/" className="mt-4 inline-block text-blue-600 underline">
        Go Home
      </a>
    </div>
  );
}

// 중첩 라우트 정의
const routes = [
  {
    path: "/",
    element: <RootLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      { index: true, element: <Dashboard /> }, // "/" 대시보드
      { path: "inventory", element: <Inventory /> }, // "/inventory"
      { path: "movements", element: <Movements /> }, // "/movements"
      { path: "settings", element: <Settings /> }, // "/settings"
    ],
  },
  // 워크스페이스 포함 경로도 동일하게 동작
  {
    path: "/app/:wsId",
    element: <RootLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      { index: true, element: <Dashboard /> }, // "/app/:wsId"
      { path: "inventory", element: <Inventory /> }, // "/app/:wsId/inventory"
      { path: "movements", element: <Movements /> }, // "/app/:wsId/movements"
      { path: "settings", element: <Settings /> }, // "/app/:wsId/settings"
    ],
  },
  // 최상위 404
  { path: "*", element: <div className="p-6">Not Found</div> },
];

const router = createBrowserRouter(routes);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}
