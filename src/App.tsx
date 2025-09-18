import {
  createBrowserRouter,
  RouterProvider,
  useRouteError,
} from "react-router-dom";

function RootError() {
  const err = useRouteError() as any;
  return (
    <div className="p-6">
      <h1 className="text-xl">Something went wrong</h1>
      <pre className="mt-2 text-sm whitespace-pre-wrap">
        {err?.message ?? "Unknown error"}
      </pre>
    </div>
  );
}

function HydrateFallback() {
  return <div />; // 초기 하이드레이션 시 표시할 최소 요소
}

const router = createBrowserRouter(
  [
    {
      path: "/",
      errorElement: <RootError />, // 루트에 에러 바운더리
      hydrateFallbackElement: <HydrateFallback />,
      lazy: async () => {
        const { RootLayout } = await import("./components/RootLayout");
        return { Component: RootLayout };
      },
      children: [
        { path: "/", lazy: () => import("./pages/Dashboard") },
        { path: "/inventory", lazy: () => import("./pages/Inventory") },
        { path: "/movements", lazy: () => import("./pages/Movements") },
        { path: "/settings", lazy: () => import("./pages/Settings") },
      ],
    },
  ],
  {
    future: { v7_partialHydration: true },
  }
);

export default function App() {
  return <RouterProvider router={router} />;
}
