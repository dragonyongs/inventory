import React, {
  useCallback,
  useState,
  useEffect,
  useMemo,
  useRef,
} from "react";
import {
  Bell,
  AlertTriangle,
  Calendar,
  TrendingDown,
  Volume2,
  Mail,
  Smartphone,
  Clock,
  TestTube,
  Save,
  RotateCcw,
} from "lucide-react";
import { useSettingsStore } from "../../stores/settingsStore";
import { useVisibleItems } from "../../stores/selectors";

interface NotificationSetting {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

export const AlertsTab: React.FC = React.memo(() => {
  const settings = useSettingsStore();
  const items = useVisibleItems();
  const isInitialMount = useRef(true);

  const [tempNotifications, setTempNotifications] = useState({
    lowStock: settings.notifications?.lowStock ?? true,
    expiringSoon: settings.notifications?.expiringSoon ?? true,
    expired: settings.notifications?.expired ?? true,
    sound: settings.notifications?.sound ?? true,
    push: settings.notifications?.push ?? false,
    email: settings.notifications?.email ?? false,
    quietHours: settings.notifications?.quietHours ?? false,
  });

  const [hasChanges, setHasChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const currentNotif = settings.notifications || {};
    const changed =
      tempNotifications.lowStock !== (currentNotif.lowStock ?? true) ||
      tempNotifications.expiringSoon !== (currentNotif.expiringSoon ?? true) ||
      tempNotifications.expired !== (currentNotif.expired ?? true) ||
      tempNotifications.sound !== (currentNotif.sound ?? true) ||
      tempNotifications.push !== (currentNotif.push ?? false) ||
      tempNotifications.email !== (currentNotif.email ?? false) ||
      tempNotifications.quietHours !== (currentNotif.quietHours ?? false);

    setHasChanges(changed);
  }, [tempNotifications, settings.notifications]);

  const alertStats = useMemo(() => {
    const enabledAlerts = Object.values(tempNotifications).filter(
      (v) => v === true
    ).length;
    const lowStockItems = items.filter(
      (item) => item.stock < (item.lowStockThreshold || 0)
    ).length;
    const totalItems = items.length;

    return {
      enabledAlerts,
      lowStockItems,
      totalItems,
    };
  }, [tempNotifications, items]);

  const handleSave = useCallback(async () => {
    setIsLoading(true);
    try {
      if (settings.setNotifications) {
        settings.setNotifications(tempNotifications);
      }
      setHasChanges(false);
    } catch (error) {
      console.error("알림 설정 저장 실패:", error);
    } finally {
      setIsLoading(false);
    }
  }, [settings, tempNotifications]);

  const handleReset = useCallback(() => {
    setTempNotifications({
      lowStock: settings.notifications?.lowStock ?? true,
      expiringSoon: settings.notifications?.expiringSoon ?? true,
      expired: settings.notifications?.expired ?? true,
      sound: settings.notifications?.sound ?? true,
      push: settings.notifications?.push ?? false,
      email: settings.notifications?.email ?? false,
      quietHours: settings.notifications?.quietHours ?? false,
    });
    setHasChanges(false);
  }, [settings.notifications]);

  const handleTestNotification = useCallback(() => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("테스트 알림", {
        body: "알림 설정이 정상적으로 작동하고 있습니다!",
        icon: "/icon-192x192.png",
      });
    } else if (
      "Notification" in window &&
      Notification.permission !== "denied"
    ) {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          new Notification("테스트 알림", {
            body: "알림 설정이 정상적으로 작동하고 있습니다!",
            icon: "/icon-192x192.png",
          });
        }
      });
    }
  }, []);

  const coreNotifications: NotificationSetting[] = [
    {
      id: "lowStock",
      label: "재고 부족 알림",
      description: "재고가 최소 수량 이하로 떨어지면 알림을 받습니다",
      enabled: tempNotifications.lowStock,
      icon: TrendingDown,
      color: "red",
    },
    {
      id: "expiringSoon",
      label: "유통기한 임박 알림",
      description: "설정한 기간 내에 만료되는 상품에 대해 알림을 받습니다",
      enabled: tempNotifications.expiringSoon,
      icon: Calendar,
      color: "orange",
    },
    {
      id: "expired",
      label: "유통기한 만료 알림",
      description: "유통기한이 지난 상품에 대해 알림을 받습니다",
      enabled: tempNotifications.expired,
      icon: AlertTriangle,
      color: "red",
    },
  ];

  const deliveryMethods = [
    {
      id: "sound",
      label: "소리 알림",
      description: "알림 발생 시 소리로 알려줍니다",
      enabled: tempNotifications.sound,
      icon: Volume2,
    },
    {
      id: "push",
      label: "푸시 알림",
      description: "브라우저 알림을 표시합니다",
      enabled: tempNotifications.push,
      icon: Smartphone,
    },
    {
      id: "email",
      label: "이메일 알림",
      description: "이메일로 알림을 받습니다",
      enabled: tempNotifications.email,
      icon: Mail,
    },
  ];

  return (
    <div className="max-w-5xl mx-auto">
      {/* 헤더 */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">알림 설정</h2>
        <p className="text-sm text-gray-500">
          재고 관리에 필요한 핵심 알림들을 설정하세요
        </p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="p-5 bg-white border border-gray-200 rounded-xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <Bell className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-sm font-medium text-gray-600">활성 알림</span>
          </div>
          <p className="text-2xl font-semibold text-gray-900">
            {alertStats.enabledAlerts}
          </p>
        </div>

        <div className="p-5 bg-white border border-gray-200 rounded-xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-red-600" />
            </div>
            <span className="text-sm font-medium text-gray-600">재고 부족</span>
          </div>
          <p
            className={`text-2xl font-semibold ${
              alertStats.lowStockItems > 0 ? "text-red-600" : "text-green-600"
            }`}
          >
            {alertStats.lowStockItems}
          </p>
        </div>

        <div className="p-5 bg-white border border-gray-200 rounded-xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-gray-600" />
            </div>
            <span className="text-sm font-medium text-gray-600">관리 상품</span>
          </div>
          <p className="text-2xl font-semibold text-gray-900">
            {alertStats.totalItems}
          </p>
        </div>
      </div>

      {/* 핵심 알림 설정 */}
      <div className="mb-6 p-6 bg-white border border-gray-200 rounded-xl">
        <h3 className="text-base font-semibold text-gray-900 mb-4">
          핵심 알림
        </h3>
        <div className="space-y-3">
          {coreNotifications.map((notification) => {
            const IconComponent = notification.icon;
            return (
              <div
                key={notification.id}
                className="flex items-start justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      notification.color === "red"
                        ? "bg-red-50"
                        : "bg-orange-50"
                    }`}
                  >
                    <IconComponent
                      className={`w-5 h-5 ${
                        notification.color === "red"
                          ? "text-red-600"
                          : "text-orange-600"
                      }`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 mb-1">
                      {notification.label}
                    </h4>
                    <p className="text-xs text-gray-500">
                      {notification.description}
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer ml-4 flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={notification.enabled}
                    onChange={(e) =>
                      setTempNotifications({
                        ...tempNotifications,
                        [notification.id]: e.target.checked,
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gray-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-900"></div>
                </label>
              </div>
            );
          })}
        </div>
      </div>

      {/* 알림 전달 방법 */}
      <div className="mb-6 p-6 bg-white border border-gray-200 rounded-xl">
        <h3 className="text-base font-semibold text-gray-900 mb-4">
          알림 전달 방법
        </h3>
        <div className="space-y-3">
          {deliveryMethods.map((method) => {
            const IconComponent = method.icon;
            return (
              <div
                key={method.id}
                className="flex items-start justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <IconComponent className="w-5 h-5 text-gray-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 mb-1">
                      {method.label}
                    </h4>
                    <p className="text-xs text-gray-500">
                      {method.description}
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer ml-4 flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={method.enabled}
                    onChange={(e) =>
                      setTempNotifications({
                        ...tempNotifications,
                        [method.id]: e.target.checked,
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gray-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-900"></div>
                </label>
              </div>
            );
          })}
        </div>
      </div>

      {/* 조용한 시간 */}
      <div className="mb-6 p-6 bg-white border border-gray-200 rounded-xl">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5 text-gray-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold text-gray-900 mb-1">
                조용한 시간
              </h3>
              <p className="text-sm text-gray-600">
                설정된 시간에만 알림을 받습니다 (오전 9시 ~ 오후 6시)
              </p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer ml-4 flex-shrink-0">
            <input
              type="checkbox"
              checked={tempNotifications.quietHours}
              onChange={(e) =>
                setTempNotifications({
                  ...tempNotifications,
                  quietHours: e.target.checked,
                })
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gray-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-900"></div>
          </label>
        </div>
      </div>

      {/* 테스트 알림 */}
      <div className="mb-6 p-6 bg-blue-50 border border-blue-100 rounded-xl">
        <div className="flex items-start gap-3 mb-4">
          <TestTube className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-gray-900 mb-1">
              알림 설정 테스트
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              알림 설정을 테스트해보세요
            </p>
            <button
              onClick={handleTestNotification}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              테스트 알림 보내기
            </button>
          </div>
        </div>
        <p className="text-xs text-blue-700 flex items-start gap-2">
          <span>💡</span>
          <span>
            브라우저에서 알림 권한을 허용해야 푸시 알림을 받을 수 있습니다.
          </span>
        </p>
      </div>

      {/* 저장/초기화 버튼 */}
      {hasChanges && (
        <div className="flex gap-3 sticky bottom-4">
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            <Save className="w-4 h-4" />
            {isLoading ? "저장 중..." : "변경사항 저장"}
          </button>
          <button
            onClick={handleReset}
            disabled={isLoading}
            className="px-4 py-3 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
});

AlertsTab.displayName = "AlertsTab";
