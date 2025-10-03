// src/components/RootLayout.tsx
import { Outlet, NavLink } from "react-router-dom";
import { useState, useEffect } from "react";
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
import { useScrollDirection } from "@/hooks/useScrollDirection";

export function RootLayout({ children }: { children?: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const scrollDirection = useScrollDirection({
    threshold: 50, // 50px 이상 스크롤 시 반응
    topOffset: 100, // 상단 100px 영역은 항상 헤더 표시
    scrollContainerSelector: "main",
  });

  // ✅ iOS Safari viewport 높이 보정
  useEffect(() => {
    const setVh = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty("--vh", `${vh}px`);
    };

    setVh();

    // resize와 orientationchange 모두 감지
    window.addEventListener("resize", setVh);
    window.addEventListener("orientationchange", setVh);

    return () => {
      window.removeEventListener("resize", setVh);
      window.removeEventListener("orientationchange", setVh);
    };
  }, []);

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
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 flex-col border-r border-gray-200 bg-white md:flex">
        <div className="flex h-full flex-col">
          {/* Workspace Selector - 최상단 */}
          <div className="border-b border-gray-100 px-4 pb-3 pt-6">
            <WorkspaceSelector variant="compact" />
          </div>

          {/* App Title */}
          <div className="border-b border-gray-100 px-4 py-3">
            <h1 className="text-base font-semibold text-gray-800">재고관리</h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
            {navigationItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={navLinkClass}
                end={item.to === "/"}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* User Profile - 데스크톱 하단 */}
          <div className="border-t border-gray-100 px-4 py-4">
            <UserProfile />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* 모바일 헤더 - 스크롤 시 숨김 */}
        <div
          className={`border-b border-gray-200 bg-white transition-transform duration-300 ease-in-out md:hidden ${
            scrollDirection === "down" &&
            "fixed -translate-y-full top-0 left-0 right-0 z-30 "
          }`}
        >
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100"
                aria-label="메뉴"
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
              <h1 className="text-lg font-semibold text-gray-900">물품관리</h1>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <>
            {/* 배경 Backdrop 레이어 */}
            <div
              className="fixed inset-0 z-40 bg-black/50 md:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
              aria-hidden="true"
            />

            {/* Sidebar 레이어 */}
            <aside
              className="fixed inset-y-0 left-0 z-50 w-80 transform bg-white shadow-xl transition-transform duration-300 ease-in-out md:hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex h-full flex-col">
                {/* Workspace Selector - 모바일도 최상단 */}
                <div className="px-4 py-6 border-b border-gray-100 ">
                  <WorkspaceSelector variant="compact" />
                </div>

                {/* App Title */}
                <div className="border-b border-gray-100 px-4 py-3">
                  <h1 className="text-base font-semibold text-gray-800">
                    재고관리
                  </h1>
                </div>

                {/* Navigation */}
                <nav className="flex-1 space-y-2 overflow-y-auto px-4 pb-4 pt-6">
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
                          <div className="mt-0.5 text-xs text-gray-500">
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
          </>
        )}

        {/* Main Content Area */}
        <main
          className="flex-1 overflow-y-auto"
          style={{
            // ✅ iOS safe area + 동적 뷰포트 대응
            minHeight:
              "calc(100dvh - env(safe-area-inset-top) - env(safe-area-inset-bottom))",
            paddingBottom: "calc(env(safe-area-inset-bottom) + 4rem)",
          }}
        >
          {children || <Outlet />}
        </main>
      </div>

      <DevTools />
    </div>
  );
}
