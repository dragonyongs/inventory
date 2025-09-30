// src/components/RootLayout.tsx
import { Outlet, NavLink } from "react-router-dom";
import { useState } from "react";
import {
  BarChart3,
  Package,
  ArrowUpDown,
  Settings,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";
import { DevTools } from "./DevTools";
import WorkspaceSelector from "./WorkspaceSelector";
import { UserProfile } from "./profile/UserProfile";

export function RootLayout({ children }: { children?: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
      isActive
        ? "bg-blue-50 text-blue-700 border-r-2 border-blue-600"
        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
    }`;

  const mobileNavLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center justify-between px-4 py-3.5 text-base font-medium rounded-lg transition-all duration-200 ${
      isActive
        ? "bg-blue-50 text-blue-700 border-l-4 border-blue-600"
        : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
    }`;

  const navigationItems = [
    {
      to: "/",
      icon: BarChart3,
      label: "대시보드",
      description: "전체 현황 보기",
    },
    {
      to: "/inventory",
      icon: Package,
      label: "인벤토리",
      description: "상품 관리",
    },
    {
      to: "/movements",
      icon: ArrowUpDown,
      label: "이동내역",
      description: "입출고 기록",
    },
    {
      to: "/settings",
      icon: Settings,
      label: "설정",
      description: "앱 설정",
    },
  ];

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64 border-r border-gray-200 bg-white">
          {/* Workspace Selector - 최상단 배치 */}
          <div className="px-3 pt-4 pb-2">
            <WorkspaceSelector variant="compact" />
          </div>

          {/* App Title */}
          <div className="px-4 py-3 border-b border-gray-100">
            <h1 className="text-sm font-semibold text-gray-700">재고관리</h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 pt-4 pb-4 space-y-1 overflow-y-auto">
            {navigationItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={navLinkClass}
                end={item.to === "/"}
              >
                <item.icon className="mr-3 h-5 w-5 flex-shrink-0 transition-colors" />
                <span className="flex-1">{item.label}</span>
              </NavLink>
            ))}
          </nav>

          {/* User Profile - 하단 고정 */}
          <div className="border-t border-gray-100 px-3 py-3">
            <UserProfile />
          </div>
        </div>
      </aside>

      {/* Mobile Menu Button */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
              aria-label="메뉴"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
            <h1 className="text-lg font-semibold text-gray-900">재고관리</h1>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black bg-opacity-50"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <aside
            className="fixed inset-y-0 left-0 w-80 bg-white shadow-xl transform transition-transform duration-300 ease-in-out"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col h-full">
              {/* Workspace Selector - 모바일도 최상단 */}
              <div className="px-4 pt-6 pb-3">
                <WorkspaceSelector variant="compact" />
              </div>

              {/* App Title */}
              <div className="px-4 py-3 border-b border-gray-100">
                <h1 className="text-base font-semibold text-gray-800">
                  재고관리
                </h1>
              </div>

              {/* Navigation */}
              <nav className="flex-1 px-4 pt-6 pb-4 space-y-2 overflow-y-auto">
                {navigationItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={mobileNavLinkClass}
                    onClick={() => setIsMobileMenuOpen(false)}
                    end={item.to === "/"}
                  >
                    <div className="flex items-center space-x-3">
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      <div>
                        <div className="font-medium">{item.label}</div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {item.description}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </NavLink>
                ))}
              </nav>

              {/* User Profile - 모바일 하단 */}
              <div className="border-t border-gray-100 px-4 py-4">
                <UserProfile />
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-auto md:mt-0 mt-16">
        <div className="h-full">
          {children}
          <Outlet />
        </div>
      </main>

      <DevTools />
    </div>
  );
}
