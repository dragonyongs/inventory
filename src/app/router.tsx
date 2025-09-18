// src/app/router.tsx
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import AppLayout from "@/layouts/AppLayout";
import { RouteErrorBoundary } from "@/routes/ErrorBoundary";
import RequirePermission from "@/routes/guards/RequirePermission";
import ItemsPage from "@/pages/items/ItemsPage";
import MovementsPage from "@/pages/movements/MovementsPage";
import EditItemPage from "@/pages/items/EditItemPage";

const router = createBrowserRouter([
  {
    path: "/app/:wsId",
    element: <AppLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        index: true,
        element: (
          <RequirePermission page="view">
            <ItemsPage />
          </RequirePermission>
        ),
      },
      {
        path: "movements",
        element: (
          <RequirePermission page="view">
            <MovementsPage />
          </RequirePermission>
        ),
      },
      {
        path: "items/:itemId/edit",
        element: (
          <RequirePermission page="edit">
            <EditItemPage />
          </RequirePermission>
        ),
      },
    ],
  },
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}
