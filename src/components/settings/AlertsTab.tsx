// src/pages/settings/AlertsTab.tsx
import React, { useCallback, useState, useMemo, useEffect } from "react";
import {
  Bell,
  AlertTriangle,
  Package,
  Clock,
  Zap,
  TrendingUp,
  Check,
  Volume2,
  Mail,
  Settings,
} from "lucide-react";
import { useSettingsStore } from "@/stores/settingsStore";
import { useItemList } from "@/stores/selectors";

interface AdditionalSettings {
  soundEnabled: boolean;
  pushEnabled: boolean;
  emailEnabled: boolean;
  stockThreshold: number;
  expiryDays: number;
  operatingHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
}

const defaultAdditionalSettings: AdditionalSettings = {
  soundEnabled: true,
  pushEnabled: true,
  emailEnabled: false,
  stockThreshold: 5,
  expiryDays: 7,
  operatingHours: {
    enabled: false,
    start: "09:00",
    end: "18:00",
  },
};

const loadAdditionalSettings = (): AdditionalSettings => {
  try {
    const saved = localStorage.getItem("alertsAdditionalSettings");
    if (saved) {
      return { ...defaultAdditionalSettings, ...JSON.parse(saved) };
    }
  } catch (error) {
    console.warn("추가 설정 로드 실패:", error);
  }
  return defaultAdditionalSettings;
};

const saveAdditionalSettings = (settings: AdditionalSettings): void => {
  try {
    localStorage.setItem("alertsAdditionalSettings", JSON.stringify(settings));
  } catch (error) {
    console.warn("추가 설정 저장 실패:", error);
  }
};

export const AlertsTab: React.FC = React.memo(() => {
  const { notifications, setNotifications } = useSettingsStore();
  const items = useItemList();

  const [tempNotifications, setTempNotifications] = useState(notifications);
  const [additionalSettings, setAdditionalSettings] =
    useState<AdditionalSettings>(loadAdditionalSettings);
  const [hasChanges, setHasChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 변경사항 감지
  useEffect(() => {
    const notificationChanged =
      JSON.stringify(notifications) !== JSON.stringify(tempNotifications);
    const additionalChanged =
      JSON.stringify(loadAdditionalSettings()) !==
      JSON.stringify(additionalSettings);
    setHasChanges(notificationChanged || additionalChanged);
  }, [notifications, tempNotifications, additionalSettings]);

  // 통계 계산
  const alertStats = useMemo(() => {
    const defaultStats = {
      totalItems: 0,
      lowStockItems: 0,
      enabledAlerts: 0,
    };

    if (!Array.isArray(items)) {
      const notificationCount =
        Object.values(tempNotifications).filter(Boolean).length;
      const additionalCount = Object.entries(additionalSettings).filter(
        ([key, value]) =>
          typeof value === "boolean" && value && !key.includes("operatingHours")
      ).length;

      return {
        ...defaultStats,
        enabledAlerts: notificationCount + additionalCount,
      };
    }

    const lowStockItems = items.filter((item: any) => {
      const currentStock = item?.stock || 0;
      const minStock = item?.minStock || additionalSettings.stockThreshold;
      return currentStock <= minStock;
    }).length;

    const notificationCount =
      Object.values(tempNotifications).filter(Boolean).length;
    const additionalCount = Object.entries(additionalSettings).filter(
      ([key, value]) =>
        typeof value === "boolean" && value && !key.includes("operatingHours")
    ).length;

    return {
      totalItems: items.length,
      lowStockItems,
      enabledAlerts: notificationCount + additionalCount,
    };
  }, [items?.length, tempNotifications, additionalSettings]);

  // 핸들러 함수들
  const handleNotificationChange = useCallback(
    (key: string, value: boolean) => {
      setTempNotifications((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const handleAdditionalSettingChange = useCallback(
    <T extends keyof AdditionalSettings>(
      key: T,
      value: AdditionalSettings[T]
    ) => {
      setAdditionalSettings((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const handleOperatingHoursChange = useCallback(
    (
      field: keyof AdditionalSettings["operatingHours"],
      value: string | boolean
    ) => {
      setAdditionalSettings((prev) => ({
        ...prev,
        operatingHours: { ...prev.operatingHours, [field]: value },
      }));
    },
    []
  );

  const handleSave = useCallback(async () => {
    setIsLoading(true);
    try {
      setNotifications(tempNotifications);
      saveAdditionalSettings(additionalSettings);
      setHasChanges(false);
    } catch (error) {
      console.error("설정 저장 실패:", error);
    } finally {
      setIsLoading(false);
    }
  }, [tempNotifications, additionalSettings, setNotifications]);

  const handleReset = useCallback(() => {
    setTempNotifications({
      lowStock: true,
      expiry: true,
      newMovements: false,
    });
    setAdditionalSettings(defaultAdditionalSettings);
  }, []);

  const handleTestNotification = useCallback(() => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("재고 관리 알림 테스트", {
        body: "알림이 정상적으로 작동하고 있습니다!",
        icon: "/icon-192x192.png",
      });
    } else if (
      "Notification" in window &&
      Notification.permission !== "denied"
    ) {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          new Notification("재고 관리 알림 테스트", {
            body: "알림이 정상적으로 작동하고 있습니다!",
            icon: "/icon-192x192.png",
          });
        }
      });
    }
  }, []);

  return (
    <div className="space-y-6">
      {/* 변경사항 저장 바 */}
      {hasChanges && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">알림 설정이 변경되었습니다.</p>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleReset}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={isLoading}
              >
                초기화
              </button>
              <button
                onClick={handleSave}
                disabled={isLoading}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                {isLoading ? "저장 중..." : "저장"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">
                활성 알림
              </p>
              <p className="text-3xl font-bold text-blue-600">
                {alertStats.enabledAlerts}
              </p>
              <p className="text-xs text-gray-600 mt-2">설정된 알림 수</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-xl">
              <Bell className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">
                재고 부족
              </p>
              <p
                className={`text-3xl font-bold ${
                  alertStats.lowStockItems > 0
                    ? "text-red-600"
                    : "text-green-600"
                }`}
              >
                {alertStats.lowStockItems}
              </p>
              <p className="text-xs text-gray-600 mt-2">
                {alertStats.lowStockItems > 0 ? "주의 필요" : "모든 재고 안전"}
              </p>
            </div>
            <div
              className={`p-3 rounded-xl ${
                alertStats.lowStockItems > 0 ? "bg-red-100" : "bg-green-100"
              }`}
            >
              {alertStats.lowStockItems > 0 ? (
                <AlertTriangle className="w-6 h-6 text-red-600" />
              ) : (
                <Check className="w-6 h-6 text-green-600" />
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">
                관리 상품
              </p>
              <p className="text-3xl font-bold text-purple-600">
                {alertStats.totalItems}
              </p>
              <p className="text-xs text-gray-600 mt-2">등록된 상품 수</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-xl">
              <Package className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* 기본 알림 설정 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Bell className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">알림 유형</h2>
            <p className="text-sm text-gray-600">
              재고 관리에 필요한 핵심 알림들을 설정하세요
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {[
            {
              key: "lowStock",
              title: "재고 부족 알림",
              description: "상품의 재고가 최소 수량 이하로 떨어졌을 때",
              icon: Package,
              color: "text-red-600",
              bgColor: "bg-red-50",
            },
            {
              key: "expiry",
              title: "유통기한 임박 알림",
              description: "상품의 유통기한이 임박했을 때",
              icon: Clock,
              color: "text-orange-600",
              bgColor: "bg-orange-50",
            },
            {
              key: "newMovements",
              title: "입출고 기록 알림",
              description: "새로운 입출고 기록이 추가되었을 때",
              icon: TrendingUp,
              color: "text-blue-600",
              bgColor: "bg-blue-50",
            },
          ].map((notification) => (
            <div
              key={notification.key}
              className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-4">
                <div className={`p-3 ${notification.bgColor} rounded-xl`}>
                  <notification.icon
                    className={`w-5 h-5 ${notification.color}`}
                  />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">
                    {notification.title}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {notification.description}
                  </p>
                </div>
              </div>

              <button
                onClick={() =>
                  handleNotificationChange(
                    notification.key,
                    !tempNotifications[
                      notification.key as keyof typeof tempNotifications
                    ]
                  )
                }
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 ${
                  tempNotifications[
                    notification.key as keyof typeof tempNotifications
                  ]
                    ? "bg-blue-600"
                    : "bg-gray-200"
                }`}
                role="switch"
                aria-checked={
                  tempNotifications[
                    notification.key as keyof typeof tempNotifications
                  ]
                }
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    tempNotifications[
                      notification.key as keyof typeof tempNotifications
                    ]
                      ? "translate-x-5"
                      : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 추가 설정 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Settings className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">추가 설정</h2>
            <p className="text-sm text-gray-600">
              알림 방식과 세부 옵션을 설정하세요
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 알림 방식 설정 */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900 mb-3">알림 방식</h3>

            {/* 소리 알림 */}
            <div className="flex items-center justify-between p-3 rounded-lg border border-gray-100">
              <div className="flex items-center space-x-3">
                <Volume2 className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="font-medium text-gray-900">소리 알림</p>
                  <p className="text-sm text-gray-600">
                    알림 발생 시 소리로 알려줍니다
                  </p>
                </div>
              </div>
              <button
                onClick={() =>
                  handleAdditionalSettingChange(
                    "soundEnabled",
                    !additionalSettings.soundEnabled
                  )
                }
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                  additionalSettings.soundEnabled
                    ? "bg-blue-600"
                    : "bg-gray-200"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    additionalSettings.soundEnabled
                      ? "translate-x-5"
                      : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* 푸시 알림 */}
            <div className="flex items-center justify-between p-3 rounded-lg border border-gray-100">
              <div className="flex items-center space-x-3">
                <Bell className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="font-medium text-gray-900">푸시 알림</p>
                  <p className="text-sm text-gray-600">
                    브라우저 알림을 표시합니다
                  </p>
                </div>
              </div>
              <button
                onClick={() =>
                  handleAdditionalSettingChange(
                    "pushEnabled",
                    !additionalSettings.pushEnabled
                  )
                }
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                  additionalSettings.pushEnabled ? "bg-blue-600" : "bg-gray-200"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    additionalSettings.pushEnabled
                      ? "translate-x-5"
                      : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* 이메일 알림 */}
            <div className="flex items-center justify-between p-3 rounded-lg border border-gray-100">
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="font-medium text-gray-900">이메일 알림</p>
                  <p className="text-sm text-gray-600">
                    이메일로 알림을 받습니다
                  </p>
                </div>
              </div>
              <button
                onClick={() =>
                  handleAdditionalSettingChange(
                    "emailEnabled",
                    !additionalSettings.emailEnabled
                  )
                }
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                  additionalSettings.emailEnabled
                    ? "bg-blue-600"
                    : "bg-gray-200"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    additionalSettings.emailEnabled
                      ? "translate-x-5"
                      : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* 임계값 설정 */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900 mb-3">임계값 설정</h3>

            {/* 재고 부족 임계값 */}
            <div className="p-3 rounded-lg border border-gray-100">
              <label className="block">
                <span className="font-medium text-gray-900">
                  재고 부족 기준
                </span>
                <p className="text-sm text-gray-600 mb-2">
                  이 수량 이하일 때 알림을 받습니다
                </p>
                <input
                  type="number"
                  min="0"
                  value={additionalSettings.stockThreshold}
                  onChange={(e) =>
                    handleAdditionalSettingChange(
                      "stockThreshold",
                      parseInt(e.target.value) || 0
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                />
              </label>
            </div>

            {/* 유통기한 임박 기준 */}
            <div className="p-3 rounded-lg border border-gray-100">
              <label className="block">
                <span className="font-medium text-gray-900">
                  유통기한 임박 기준
                </span>
                <p className="text-sm text-gray-600 mb-2">
                  유통기한이 며칠 남았을 때 알림을 받을지 설정합니다
                </p>
                <input
                  type="number"
                  min="1"
                  value={additionalSettings.expiryDays}
                  onChange={(e) =>
                    handleAdditionalSettingChange(
                      "expiryDays",
                      parseInt(e.target.value) || 1
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                />
              </label>
            </div>
          </div>
        </div>

        {/* 운영 시간 설정 */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="font-medium text-gray-900">운영 시간 설정</h4>
              <p className="text-sm text-gray-600">
                설정된 시간에만 알림을 받습니다
              </p>
            </div>
            <button
              onClick={() =>
                handleOperatingHoursChange(
                  "enabled",
                  !additionalSettings.operatingHours.enabled
                )
              }
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                additionalSettings.operatingHours.enabled
                  ? "bg-blue-600"
                  : "bg-gray-200"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  additionalSettings.operatingHours.enabled
                    ? "translate-x-5"
                    : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {additionalSettings.operatingHours.enabled && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  시작 시간
                </label>
                <input
                  type="time"
                  value={additionalSettings.operatingHours.start}
                  onChange={(e) =>
                    handleOperatingHoursChange("start", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  종료 시간
                </label>
                <input
                  type="time"
                  value={additionalSettings.operatingHours.end}
                  onChange={(e) =>
                    handleOperatingHoursChange("end", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 알림 테스트 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-green-100 rounded-lg">
            <Zap className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">알림 테스트</h2>
            <p className="text-sm text-gray-600">알림 설정을 테스트해보세요</p>
          </div>
        </div>

        <button
          onClick={handleTestNotification}
          disabled={!additionalSettings.pushEnabled}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Zap className="w-4 h-4" />
          테스트 알림 보내기
        </button>

        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>팁:</strong> 테스트 알림을 통해 현재 설정이 올바르게
            작동하는지 확인할 수 있습니다. 브라우저에서 알림 권한을 허용해야
            푸시 알림을 받을 수 있습니다.
          </p>
        </div>
      </div>
    </div>
  );
});

AlertsTab.displayName = "AlertsTab";
