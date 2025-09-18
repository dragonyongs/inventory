// src/components/RootLayout.tsx
import { Outlet, Link } from "react-router-dom";

export function RootLayout() {
  return (
    <div className="min-h-dvh grid grid-rows-[auto_1fr]">
      <header className="border-b px-4 py-2 flex gap-4">
        <Link to="/">Dashboard</Link>
        <Link to="/inventory">Inventory</Link>
        <Link to="/movements">Movements</Link>
        <Link to="/settings">Settings</Link>
      </header>
      <main className="p-4">
        <Outlet />
      </main>
    </div>
  );
}
