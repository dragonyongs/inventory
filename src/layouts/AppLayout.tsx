import { Outlet } from "react-router-dom";

export default function AppLayout() {
  return (
    <div className="min-h-dvh flex flex-col">
      <header className="h-12 border-b px-4 flex items-center">
        Inventory
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
