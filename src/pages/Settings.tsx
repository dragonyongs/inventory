// src/pages/Settings.tsx - URL 파라미터로 탭 전환 지원
import React, { useCallback, useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Bell, Database, Settings as SettingsIcon, Users } from "lucide-react";
import { GeneralTab } from "@/components/settings/GeneralTab";
import { AlertsTab } from "@/components/settings/AlertsTab";
import { DataTab } from "@/components/settings/DataTab";
import { WorkspaceTab } from "@/components/settings/WorkspaceTab";

type TabKey = "general" | "alerts" | "data" | "workspace";

interface Tab {
  key: TabKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const Settings: React.FC = React.memo(() => {
  const navigate = useNavigate();
  const location = useLocation();

  // 🔧 추가: URL 쿼리 파라미터에서 탭 정보 읽기
  const getInitialTab = useCallback((): TabKey => {
    const urlParams = new URLSearchParams(location.search);
    const tabParam = urlParams.get("tab") as TabKey;

    // 유효한 탭이면 해당 탭 반환, 아니면 기본값
    if (["general", "alerts", "data", "workspace"].includes(tabParam)) {
      return tabParam;
    }
    return "general";
  }, [location.search]);

  const [activeTab, setActiveTab] = useState<TabKey>(getInitialTab);

  // 🔧 추가: URL 변경 시 탭 상태 업데이트
  useEffect(() => {
    const newTab = getInitialTab();
    setActiveTab(newTab);
  }, [getInitialTab]);

  const tabs: Tab[] = [
    {
      key: "general",
      label: "일반",
      icon: SettingsIcon,
    },
    {
      key: "alerts",
      label: "알림",
      icon: Bell,
    },
    {
      key: "data",
      label: "데이터",
      icon: Database,
    },
    {
      key: "workspace",
      label: "워크스페이스",
      icon: Users,
    },
  ];

  // 🔧 수정: 탭 변경 시 URL 업데이트
  const handleTabChange = useCallback(
    (tabKey: TabKey) => {
      setActiveTab(tabKey);

      // URL 쿼리 파라미터 업데이트 (브라우저 히스토리에는 추가하지 않음)
      const urlParams = new URLSearchParams(location.search);
      if (tabKey === "general") {
        urlParams.delete("tab"); // 기본 탭이면 파라미터 제거
      } else {
        urlParams.set("tab", tabKey);
      }

      const newSearch = urlParams.toString();
      const newUrl = `${location.pathname}${newSearch ? `?${newSearch}` : ""}`;

      // replace를 사용하여 브라우저 히스토리를 쌓지 않음
      navigate(newUrl, { replace: true });
    },
    [location.pathname, location.search, navigate]
  );

  const renderTabContent = useCallback(() => {
    switch (activeTab) {
      case "general":
        return <GeneralTab />;
      case "alerts":
        return <AlertsTab />;
      case "data":
        return <DataTab />;
      case "workspace":
        return <WorkspaceTab />;
      default:
        return null;
    }
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">설정</h1>
          <p className="text-gray-600">애플리케이션 설정을 관리하세요</p>
        </div>

        {/* 탭 네비게이션 */}
        <div className="bg-white rounded-xl border border-gray-200 mb-6">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                className={`flex items-center space-x-3 px-6 py-4 border-b-2 transition-colors whitespace-nowrap min-w-0 ${
                  activeTab === tab.key
                    ? "border-blue-500 text-blue-600 bg-blue-50"
                    : "border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                <tab.icon className="w-5 h-5 flex-shrink-0" />
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 탭 컨텐츠 */}
        <div className="space-y-6">{renderTabContent()}</div>
      </div>
    </div>
  );
});

Settings.displayName = "Settings";
export default Settings;
