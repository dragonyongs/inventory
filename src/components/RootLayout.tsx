// src/components/RootLayout.tsx
import { Outlet, NavLink, useParams } from "react-router-dom";
import { useBootstrapInventory } from "../hooks/useBootstrapInventory";

export function RootLayout() {
  // 인벤토리 부트스트랩(동기 스토어 업데이트) 수행
  useBootstrapInventory();

  const { wsId } = useParams();

  // 네비게이션 빌더: wsId가 있으면 /app/:wsId/* 경로를 사용
  const makeHref = (slug: string) => (wsId ? `/app/${wsId}${slug}` : `${slug}`);

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-2 rounded ${
      isActive ? "bg-blue-600 text-white" : "text-blue-700 hover:bg-blue-50"
    }`;

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <nav className="flex gap-2">
            <NavLink to={makeHref("/")} end className={navLinkClass}>
              Dashboard
            </NavLink>
            <NavLink to={makeHref("/inventory")} className={navLinkClass}>
              Inventory
            </NavLink>
            <NavLink to={makeHref("/movements")} className={navLinkClass}>
              Movements
            </NavLink>
            <NavLink to={makeHref("/settings")} className={navLinkClass}>
              Settings
            </NavLink>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}

export default RootLayout;
