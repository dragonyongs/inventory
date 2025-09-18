// src/components/RootLayout.tsx
import { Outlet, NavLink } from "react-router-dom";

export function RootLayout() {
  return (
    <div className="min-h-dvh grid grid-rows-[auto_1fr]">
      <header className="border-b px-4 py-2 flex gap-4">
        <NavLink to="/" className="font-medium">
          Dashboard
        </NavLink>
        <NavLink to="/inventory" className="font-medium">
          Inventory
        </NavLink>
        <NavLink to="/movements" className="font-medium">
          Movements
        </NavLink>
        <NavLink to="/settings" className="font-medium">
          Settings
        </NavLink>
      </header>
      <main className="p-4">
        <Outlet />
      </main>
    </div>
  );
}
