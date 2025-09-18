// src/App.tsx
import { createBrowserRouter, RouterProvider, Route } from "react-router-dom";

const router = createBrowserRouter([
  {
    path: "/",
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
]);

export default function App() {
  return <RouterProvider router={router} />;
}
