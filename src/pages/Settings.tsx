// src/pages/Settings.tsx
import React, { useCallback, useState, useEffect, useRef } from "react";
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
  const tabRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});

  const getInitialTab = useCallback((): TabKey => {
    const urlParams = new URLSearchParams(location.search);
    const tabParam = urlParams.get("tab") as TabKey;
    if (["general", "alerts", "data", "workspace"].includes(tabParam)) {
      return tabParam;
    }
    return "general";
  }, [location.search]);

  const [activeTab, setActiveTab] = useState<TabKey>(getInitialTab);

  const tabs: Tab[] = [
    { key: "general", label: "일반", icon: SettingsIcon },
    { key: "alerts", label: "알림", icon: Bell },
    { key: "data", label: "데이터", icon: Database },
    { key: "workspace", label: "워크스페이스", icon: Users },
  ];

  useEffect(() => {
    const currentTabRef = tabRefs.current[activeTab];
    if (currentTabRef) {
      currentTabRef.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    }
  }, [activeTab]);

  useEffect(() => {
    const newTab = getInitialTab();
    setActiveTab(newTab);
  }, [getInitialTab]);

  const handleTabChange = useCallback(
    (tabKey: TabKey) => {
      setActiveTab(tabKey);
      const urlParams = new URLSearchParams(location.search);
      if (tabKey === "general") {
        urlParams.delete("tab");
      } else {
        urlParams.set("tab", tabKey);
      }
      const newSearch = urlParams.toString();
      const newUrl = `${location.pathname}${newSearch ? `?${newSearch}` : ""}`;
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
      {/* 헤더 */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            설정
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            애플리케이션 설정을 관리하세요
          </p>
        </div>

        {/* 탭 네비게이션 */}
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="no-scrollbar -mb-px flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  ref={(el) => {
                    tabRefs.current[tab.key] = el;
                  }}
                  onClick={() => handleTabChange(tab.key)}
                  className={`group inline-flex flex-shrink-0 items-center border-b-2 px-1 py-4 text-sm font-medium transition-all ${
                    isActive
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                  }`}
                >
                  <Icon
                    className={`mr-2 h-5 w-5 ${
                      isActive
                        ? "text-blue-600"
                        : "text-gray-400 group-hover:text-gray-500"
                    }`}
                  />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 탭 컨텐츠 */}
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {renderTabContent()}
      </div>
    </div>
  );
});

Settings.displayName = "Settings";

export default Settings;
