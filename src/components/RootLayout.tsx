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
import { DevTools } from "./DevTools"; // DevTools 임포트 추가

export function RootLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `group flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ${
      isActive
        ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25 transform scale-[1.02]"
        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50 active:scale-[0.98]"
    }`;

  const mobileNavLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center justify-between px-4 py-3 text-base font-medium rounded-lg transition-colors ${
      isActive ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-gray-50"
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
    { to: "/settings", icon: Settings, label: "설정", description: "앱 설정" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* DevTools 추가 */}
      <DevTools />

      {/* 기존 코드는 그대로... */}
      {/* Mobile Header */}
      <header className="bg-white shadow-sm border-b lg:hidden sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">재고관리</h1>
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg text-gray-400 hover:text-gray-500 hover:bg-gray-100 transition-colors"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-white border-b shadow-lg">
          <div className="px-4 py-3 space-y-1">
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
                    <Icon className="w-5 h-5 mr-3" />
                    <div>
                      <div>{item.label}</div>
                      <div className="text-xs text-gray-500">
                        {item.description}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4" />
                </NavLink>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex lg:flex-col lg:w-72 lg:fixed lg:inset-y-0 lg:z-50">
          <div className="flex flex-col flex-1 bg-white shadow-xl">
            {/* Logo */}
            <div className="flex items-center h-16 px-6 bg-gradient-to-r from-blue-500 to-blue-600">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mr-3">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">재고관리</h1>
                <p className="text-blue-100 text-sm">Smart Inventory</p>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-6 space-y-2">
              <div className="mb-6">
                <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  메뉴
                </h3>
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
                            <div className="font-medium">{item.label}</div>
                            <div className="text-xs opacity-75 group-hover:opacity-100 transition-opacity">
                              {item.description}
                            </div>
                          </div>
                        </div>
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            </nav>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-100">
              <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg p-3">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full flex items-center justify-center mr-3">
                    <span className="text-xs font-bold text-white">V</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Version 1.0
                    </p>
                    <p className="text-xs text-gray-500">© 2025 재고관리</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 lg:pl-72">
          <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
