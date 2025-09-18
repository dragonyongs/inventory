import { createBrowserRouter, RouterProvider } from "react-router-dom";

function HydrateFallback() {
  return <div />; // 초기 하이드레이션 시 표시할 최소 요소
}

const router = createBrowserRouter(
  [
    {
      path: "/",
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
