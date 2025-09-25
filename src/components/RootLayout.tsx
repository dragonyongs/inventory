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
    <div className="min-h-screen bg-white">
      <DevTools />

      {/* Mobile Header */}
      <header className="bg-white border-b border-gray-200 lg:hidden sticky top-0 z-40 backdrop-blur-sm bg-white/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Package className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  재고관리
                </h1>
              </div>
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-gray-200 shadow-sm">
          <div className="px-4 py-4 space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={mobileNavLinkClass}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <div className="flex items-center">
                    <Icon className="w-5 h-5 mr-3 text-current" />
                    <div>
                      <div className="font-medium">{item.label}</div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {item.description}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </NavLink>
              );
            })}
          </div>

          {/* Mobile 워크스페이스 & 사용자 정보 */}
          <div className="px-4 py-4 border-t border-gray-100 space-y-3 bg-gray-50">
            <WorkspaceSelector />
            <UserProfile />
          </div>
        </div>
      )}

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:z-50">
          <div className="flex flex-col flex-1 bg-white border-r border-gray-200">
            {/* Logo */}
            <div className="flex items-center h-16 px-6 border-b border-gray-200">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                <Package className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  재고관리
                </h1>
                <p className="text-xs text-gray-500">Smart Inventory</p>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-6">
              <div className="space-y-1">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={navLinkClass}
                    >
                      <div className="flex items-center min-w-0 flex-1">
                        <Icon className="w-5 h-5 mr-3 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-sm">
                            {item.label}
                          </div>
                        </div>
                      </div>
                    </NavLink>
                  );
                })}
              </div>
            </nav>

            {/* Workspace & User Section */}
            <div className="px-4 py-4 border-t border-gray-200 bg-gray-50/50">
              <div className="space-y-3">
                <WorkspaceSelector />
                <UserProfile />
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 lg:pl-64">
          <div className="min-h-screen bg-gray-50">
            {children || <Outlet />}
          </div>
        </main>
      </div>
    </div>
  );
}
