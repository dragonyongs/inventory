// src/pages/Settings.tsx

import React, { useState, useCallback, useMemo, useEffect } from "react";
import {
  Settings as SettingsIcon,
  Bell,
  Database,
  Building2,
  User,
  ChevronDown,
  Check,
  X,
  RefreshCw,
  Download,
  Trash2,
  Edit,
  Plus,
  AlertTriangle,
} from "lucide-react";

import { useSettingsStore, type UpdateMode } from "../stores/settingsStore";
import { useWorkspaceStore } from "../stores/workspaceStore";
import { WorkspaceModal } from "../components/WorkspaceSelector";
import { getWorkspaceTypeLabel } from "../utils/workspaceLabels";
import {
  registerSW,
  getNeedRefresh,
  applyUpdate,
  setPwaListeners,
  onUpdateAvailable,
  isUpdateAvailable,
  checkForUpdate,
  clearDevCache,
} from "../utils/pwaClient";

const TabButton = ({
  active,
  onClick,
  icon: Icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<any>;
  children: React.ReactNode;
}) => (
  <button
    onClick={onClick}
    className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
      active ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"
    }`}
  >
    <Icon className="w-4 h-4 mr-2" />
    {children}
  </button>
);

export default function Settings() {
  const [activeTab, setActiveTab] = useState("general");
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
  const [showOfflineReady, setShowOfflineReady] = useState(false);

  // Settings Store
  const {
    expiringDays,
    pageSize,
    updateMode,
    theme,
    notifications,
    setExpiringDays,
    setPageSize,
    setUpdateMode,
    setTheme,
    setNotifications,
    reset: resetSettings,
  } = useSettingsStore();

  // Workspace Store
  const {
    workspaces,
    currentWorkspaceId,
    currentWorkspace,
    createWorkspace,
    updateWorkspace,
    deleteWorkspace,
    switchWorkspace,
  } = useWorkspaceStore();

  // 🆕 워크스페이스 모달 상태
  const [showWorkspaceModal, setShowWorkspaceModal] = useState(false);
  const [workspaceModalMode, setWorkspaceModalMode] = useState<
    "create" | "edit"
  >("create");
  const [editingWorkspace, setEditingWorkspace] = useState<any>(null);

  const settings = useMemo(
    () => ({
      expiringDays,
      pageSize,
      updateMode,
      theme,
      notifications,
    }),
    [expiringDays, pageSize, updateMode, theme, notifications]
  );

  // PWA 업데이트 관련 설정
  useEffect(() => {
    setPwaListeners({
      onNeedRefresh: () => {
        console.log("PWA 업데이트 필요");
        setShowUpdatePrompt(true);
      },
      onOfflineReady: () => {
        console.log("PWA 오프라인 준비 완료");
        setShowOfflineReady(true);
      },
    });

    if (isUpdateAvailable()) {
      setShowUpdatePrompt(true);
    }

    const cleanup = onUpdateAvailable((available) => {
      setShowUpdatePrompt(available);
    });

    return cleanup;
  }, []);

  // PWA 업데이트 핸들러들
  const handleUpdate = useCallback(async () => {
    try {
      await applyUpdate();
      setShowUpdatePrompt(false);
    } catch (error) {
      console.error("업데이트 적용 실패:", error);
      alert("업데이트를 적용하는 중 오류가 발생했습니다.");
    }
  }, []);

  const handleManualUpdateCheck = useCallback(async () => {
    try {
      const hasUpdate = await checkForUpdate();
      if (hasUpdate) {
        setShowUpdatePrompt(true);
      } else {
        alert("현재 최신 버전을 사용 중입니다.");
      }
    } catch (error) {
      console.error("업데이트 확인 실패:", error);
      alert("업데이트 확인 중 오류가 발생했습니다.");
    }
  }, []);

  const handleUpdateModeChange = useCallback(
    (mode: UpdateMode) => {
      setUpdateMode(mode);
    },
    [setUpdateMode]
  );

  const handleExpiringDaysChange = useCallback(
    (days: number) => {
      if (days >= 1 && days <= 365) {
        setExpiringDays(days);
      }
    },
    [setExpiringDays]
  );

  const handlePageSizeChange = useCallback(
    (size: number) => {
      if (size >= 10 && size <= 100) {
        setPageSize(size);
      }
    },
    [setPageSize]
  );

  const handleNotificationChange = useCallback(
    (key: keyof typeof notifications, value: boolean) => {
      setNotifications({ [key]: value });
    },
    [setNotifications]
  );

  const handleClearDevCache = useCallback(async () => {
    if (
      confirm("개발 캐시를 모두 삭제하시겠습니까? 페이지가 새로고침됩니다.")
    ) {
      try {
        await clearDevCache();
      } catch (error) {
        console.error("캐시 삭제 실패:", error);
        alert("캐시 삭제 중 오류가 발생했습니다.");
      }
    }
  }, []);

  // 🆕 워크스페이스 관련 핸들러
  const handleCreateWorkspace = useCallback(() => {
    setWorkspaceModalMode("create");
    setEditingWorkspace(null);
    setShowWorkspaceModal(true);
  }, []);

  const handleEditWorkspace = useCallback((workspace: any) => {
    setWorkspaceModalMode("edit");
    setEditingWorkspace(workspace);
    setShowWorkspaceModal(true);
  }, []);

  const handleDeleteWorkspace = useCallback(
    (workspaceId: string, workspaceName: string) => {
      if (workspaceId === "default") {
        alert("기본 워크스페이스는 삭제할 수 없습니다.");
        return;
      }

      if (
        confirm(
          `${workspaceName} 워크스페이스를 삭제하시겠습니까?\n\n⚠️ 이 작업은 되돌릴 수 없으며, 해당 워크스페이스의 모든 데이터가 삭제됩니다.`
        )
      ) {
        deleteWorkspace(workspaceId);
      }
    },
    [deleteWorkspace]
  );

  // 탭 렌더링 함수들
  const renderGeneralTab = () => (
    <div className="space-y-6">
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-900 flex items-center">
          <Bell className="w-4 h-4 mr-2" />
          유통기한 알림
        </h4>
        <div className="flex items-center space-x-3">
          <label className="text-sm text-gray-600 min-w-0 flex-shrink-0">
            유통기한 알림 기간 (일)
          </label>
          <input
            type="number"
            value={settings.expiringDays}
            onChange={(e) =>
              handleExpiringDaysChange(parseInt(e.target.value) || 30)
            }
            min="1"
            max="365"
            className="w-20 px-3 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
          />
          <span className="text-sm text-gray-500">
            이 기간 내에 만료되는 상품에 대해 경고를 표시합니다
          </span>
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-900">페이지 설정</h4>
        <div className="flex items-center space-x-3">
          <label className="text-sm text-gray-600 min-w-0 flex-shrink-0">
            페이지당 항목 수
          </label>
          <select
            value={settings.pageSize}
            onChange={(e) => handlePageSizeChange(parseInt(e.target.value))}
            className="px-3 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="10">10개</option>
            <option value="20">20개</option>
            <option value="50">50개</option>
            <option value="100">100개</option>
          </select>
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-900">업데이트 모드</h4>
        <div className="relative">
          <select
            value={settings.updateMode}
            onChange={(e) =>
              handleUpdateModeChange(e.target.value as UpdateMode)
            }
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none cursor-pointer"
          >
            <option value="auto">🔄 자동 업데이트</option>
            <option value="manual">👤 수동 업데이트</option>
            <option value="prompt">❓ 확인 후 업데이트</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        </div>
        <p className="text-xs text-gray-500">
          {settings.updateMode === "auto" &&
            "새 버전이 있으면 자동으로 업데이트합니다."}
          {settings.updateMode === "manual" &&
            "수동으로 업데이트를 확인하고 적용합니다."}
          {settings.updateMode === "prompt" &&
            "새 버전이 있을 때 사용자에게 확인합니다."}
        </p>

        {settings.updateMode === "manual" && (
          <button
            onClick={handleManualUpdateCheck}
            className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            업데이트 확인
          </button>
        )}
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-900">테마</h4>
        <div className="flex space-x-2">
          {[
            { value: "light", label: "밝게", icon: "☀️" },
            { value: "dark", label: "어둡게", icon: "🌙" },
            { value: "auto", label: "자동", icon: "🔄" },
          ].map(({ value, label, icon }) => (
            <button
              key={value}
              onClick={() => setTheme(value as any)}
              className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                settings.theme === value
                  ? "bg-blue-100 text-blue-800 border border-blue-200"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {icon} {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderNotificationsTab = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-900 flex items-center">
          <Bell className="w-4 h-4 mr-2" />
          알림 설정
        </h4>

        {[
          {
            key: "lowStock" as const,
            label: "재고 부족 알림",
            desc: "최소 재고량 이하일 때 알림",
          },
          {
            key: "expiry" as const,
            label: "유통기한 알림",
            desc: "유통기한이 임박했을 때 알림",
          },
          {
            key: "newMovements" as const,
            label: "입출고 알림",
            desc: "새로운 입출고가 있을 때 알림",
          },
        ].map(({ key, label, desc }) => (
          <div
            key={key}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
          >
            <div>
              <div className="text-sm font-medium text-gray-900">{label}</div>
              <div className="text-xs text-gray-500">{desc}</div>
            </div>
            <button
              onClick={() =>
                handleNotificationChange(key, !settings.notifications[key])
              }
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.notifications[key] ? "bg-blue-600" : "bg-gray-300"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.notifications[key]
                    ? "translate-x-6"
                    : "translate-x-1"
                }`}
              />
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  const renderDataTab = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-900 flex items-center">
          <Database className="w-4 h-4 mr-2" />
          동기화 상태
        </h4>

        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Check className="h-5 w-5 text-green-600" />
            </div>
            <div className="ml-3">
              <div className="text-sm font-medium text-green-800">
                동기화 상태: 정상
              </div>
              <div className="text-sm text-green-700">대기 중인 작업: 0개</div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleManualUpdateCheck}
            className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            수동 동기화
          </button>

          <button className="w-full flex items-center justify-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
            <Download className="w-4 h-4 mr-2" />
            데이터 내보내기
          </button>

          {import.meta.env.DEV && (
            <button
              onClick={handleClearDevCache}
              className="w-full flex items-center justify-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              개발 캐시 삭제
            </button>
          )}

          <button
            onClick={resetSettings}
            className="w-full flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            설정 초기화
          </button>
        </div>
      </div>
    </div>
  );

  // 🆕 개선된 워크스페이스 탭
  const renderWorkspacesTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-900 flex items-center">
          <Building2 className="w-4 h-4 mr-2" />
          워크스페이스 관리
        </h4>
        <button
          onClick={handleCreateWorkspace}
          className="flex items-center px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-3 h-3 mr-1" />
          추가
        </button>
      </div>

      <div className="space-y-3">
        {workspaces.map((workspace) => (
          <div
            key={workspace.id}
            className={`p-4 border rounded-lg transition-colors ${
              workspace.id === currentWorkspaceId
                ? "border-blue-200 bg-blue-50"
                : "border-gray-200 bg-white hover:bg-gray-50"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <h5 className="text-sm font-medium text-gray-900 truncate">
                    {workspace.name}
                  </h5>
                  {workspace.id === currentWorkspaceId && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                      현재
                    </span>
                  )}
                  {workspace.id === "default" && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                      기본
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  <span>{getWorkspaceTypeLabel(workspace.type)}</span>
                  {workspace.description && (
                    <>
                      <span className="mx-1">•</span>
                      <span>{workspace.description}</span>
                    </>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  생성일:{" "}
                  {new Date(workspace.createdAt).toLocaleDateString("ko-KR")}
                </p>
              </div>

              <div className="flex items-center space-x-2 ml-4">
                {workspace.id !== currentWorkspaceId && (
                  <button
                    onClick={() => switchWorkspace(workspace.id)}
                    className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 hover:bg-blue-50 rounded transition-colors"
                  >
                    선택
                  </button>
                )}
                <button
                  onClick={() => handleEditWorkspace(workspace)}
                  className="text-xs text-gray-600 hover:text-gray-800 p-1 hover:bg-gray-100 rounded transition-colors"
                  title="수정"
                >
                  <Edit className="w-3 h-3" />
                </button>
                {workspace.id !== "default" && (
                  <button
                    onClick={() =>
                      handleDeleteWorkspace(workspace.id, workspace.name)
                    }
                    className="text-xs text-red-600 hover:text-red-800 p-1 hover:bg-red-50 rounded transition-colors"
                    title="삭제"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-start">
          <AlertTriangle className="w-4 h-4 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-yellow-800">
            <div className="font-medium">워크스페이스 안내</div>
            <div className="mt-1 text-xs">
              • 워크스페이스별로 별도의 재고 데이터가 관리됩니다
              <br />
              • 기본 워크스페이스는 삭제할 수 없습니다
              <br />• 워크스페이스 삭제 시 모든 데이터가 영구 삭제됩니다
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">설정</h1>
        <p className="text-gray-600 mt-1">애플리케이션 설정을 관리하세요</p>
      </div>

      {/* PWA 업데이트 알림 */}
      {showUpdatePrompt && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-blue-900">
                새로운 버전이 준비되었습니다.
              </h3>
              <p className="text-sm text-blue-700 mt-1">
                앱을 다시 시작하여 업데이트를 적용하세요.
              </p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handleUpdate}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
              >
                업데이트
              </button>
              <button
                onClick={() => setShowUpdatePrompt(false)}
                className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400"
              >
                나중에
              </button>
            </div>
          </div>
        </div>
      )}

      {showOfflineReady && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-green-900">
                이제 오프라인에서도 앱을 사용할 수 있습니다.
              </h3>
            </div>
            <button
              onClick={() => setShowOfflineReady(false)}
              className="text-green-600 hover:text-green-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 탭 네비게이션 */}
      <div className="mb-6">
        <div className="flex space-x-2 overflow-x-auto">
          <TabButton
            active={activeTab === "general"}
            onClick={() => setActiveTab("general")}
            icon={SettingsIcon}
          >
            일반
          </TabButton>
          <TabButton
            active={activeTab === "notifications"}
            onClick={() => setActiveTab("notifications")}
            icon={Bell}
          >
            알림
          </TabButton>
          <TabButton
            active={activeTab === "data"}
            onClick={() => setActiveTab("data")}
            icon={Database}
          >
            데이터
          </TabButton>
          <TabButton
            active={activeTab === "workspaces"}
            onClick={() => setActiveTab("workspaces")}
            icon={Building2}
          >
            워크스페이스
          </TabButton>
        </div>
      </div>

      {/* 탭 콘텐츠 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        {activeTab === "general" && renderGeneralTab()}
        {activeTab === "notifications" && renderNotificationsTab()}
        {activeTab === "data" && renderDataTab()}
        {activeTab === "workspaces" && renderWorkspacesTab()}
      </div>

      {/* 워크스페이스 모달 */}
      <WorkspaceModal
        isOpen={showWorkspaceModal}
        onClose={() => setShowWorkspaceModal(false)}
        mode={workspaceModalMode}
        workspace={editingWorkspace}
      />
    </div>
  );
}
