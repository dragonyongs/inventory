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
import { useWorkspaceInit } from "@/hooks/useWorkspaceInit"; // ✅ 추가

export function RootLayout({ children }: { children?: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const scrollDirection = useScrollDirection({
    threshold: 50,
    topOffset: 100,
    scrollContainerSelector: "main",
  });

  // ✅ 초대 처리 및 워크스페이스 초기화
  const { isLoading, currentWorkspace, error } = useWorkspaceInit();

  // iOS Safari viewport 높이 보정
  useEffect(() => {
    const setVh = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty("--vh", `${vh}px`);
    };

    setVh();
    window.addEventListener("resize", setVh);
    window.addEventListener("orientationchange", setVh);

    return () => {
      window.removeEventListener("resize", setVh);
      window.removeEventListener("orientationchange", setVh);
    };
  }, []);

  // ✅ 로딩 중 표시
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">워크스페이스 초기화 중...</p>
        </div>
      </div>
    );
  }

  // ✅ 에러 표시
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md p-6 bg-white rounded-lg shadow">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  // ✅ 워크스페이스 없음
  if (!currentWorkspace) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">워크스페이스를 불러오는 중...</p>
        </div>
      </div>
    );
  }

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
    { to: "/settings", icon: Settings, label: "설정", description: "앱 설정" },
  ];

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* 데스크톱 사이드바 */}
      <aside className="hidden md:flex md:flex-shrink-0 w-64 bg-white border-r border-gray-200">
        <div className="flex flex-col w-full">
          {/* 헤더 */}
          <div className="flex-shrink-0 px-4 py-4 border-b border-gray-200">
            <WorkspaceSelector />
          </div>

          {/* 네비게이션 */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navigationItems.map((item) => (
              <NavLink key={item.to} to={item.to} className={navLinkClass}>
                <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          {/* 사용자 프로필 */}
          <div className="flex-shrink-0 border-t border-gray-200 p-4">
            <UserProfile />
          </div>
        </div>
      </aside>

      {/* 메인 콘텐츠 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 모바일 헤더 */}
        <header
          className={`md:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between transition-transform duration-300 ${
            scrollDirection === "down" ? "-translate-y-full" : "translate-y-0"
          }`}
        >
          <WorkspaceSelector />
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </header>

        {/* 모바일 메뉴 */}
        {isMobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-50 bg-black bg-opacity-50">
            <div className="absolute inset-y-0 right-0 w-full max-w-sm bg-white shadow-xl">
              <div className="flex flex-col h-full">
                {/* 모바일 헤더 */}
                <div className="flex-shrink-0 px-4 py-4 border-b border-gray-200 flex items-center justify-between">
                  <span className="text-lg font-semibold text-gray-900">
                    메뉴
                  </span>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                {/* 네비게이션 */}
                <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
                  {navigationItems.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={mobileNavLinkClass}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <div className="flex items-center">
                        <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                        <div>
                          <div className="font-medium">{item.label}</div>
                          <div className="text-xs text-gray-500">
                            {item.description}
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 flex-shrink-0 text-gray-400" />
                    </NavLink>
                  ))}
                </nav>

                {/* 사용자 프로필 */}
                <div className="flex-shrink-0 border-t border-gray-200 p-4">
                  <UserProfile />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 메인 콘텐츠 영역 */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          {children || <Outlet />}
        </main>
      </div>

      <DevTools />
    </div>
  );
}
