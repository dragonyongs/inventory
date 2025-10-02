// src/components/settings/AlertsTab.tsx
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
  Package,
  Calendar,
  TrendingDown,
  Volume2,
  Mail,
  Smartphone,
  Clock,
  TestTube,
} from "lucide-react";
import { useSettingsStore } from "@/stores/settingsStore";
import { useVisibleItems } from "@/stores/selectors";

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

  // 변경사항 감지만
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

  // 통계 계산
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
    <div className="space-y-6">
      {/* 저장 알림 바 */}
      {hasChanges && (
        <div className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
          <div className="flex items-center space-x-2">
            <Bell className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">
              알림 설정이 변경되었습니다
            </span>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handleReset}
              className="rounded-md px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-white"
            >
              취소
            </button>
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? "저장 중..." : "저장"}
            </button>
          </div>
        </div>
      )}

      {/* 통계 카드 */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white px-5 py-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Bell className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">활성 알림</p>
              <p className="text-2xl font-semibold text-gray-900">
                {alertStats.enabledAlerts}
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white px-5 py-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingDown
                className={`h-8 w-8 ${
                  alertStats.lowStockItems > 0
                    ? "text-red-600"
                    : "text-green-600"
                }`}
              />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">재고 부족</p>
              <p
                className={`text-2xl font-semibold ${
                  alertStats.lowStockItems > 0
                    ? "text-red-600"
                    : "text-green-600"
                }`}
              >
                {alertStats.lowStockItems}
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white px-5 py-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Package className="h-8 w-8 text-gray-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">관리 상품</p>
              <p className="text-2xl font-semibold text-gray-900">
                {alertStats.totalItems}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 핵심 알림 설정 */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-6 py-4">
          <h3 className="text-base font-semibold text-gray-900">핵심 알림</h3>
          <p className="mt-1 text-sm text-gray-500">
            재고 관리에 필요한 핵심 알림들을 설정하세요
          </p>
        </div>
        <div className="divide-y divide-gray-200">
          {coreNotifications.map((notification) => {
            const Icon = notification.icon;
            return (
              <div key={notification.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-start">
                    <div
                      className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-${notification.color}-100`}
                    >
                      <Icon
                        className={`h-5 w-5 text-${notification.color}-600`}
                      />
                    </div>
                    <div className="ml-4">
                      <h4 className="text-sm font-medium text-gray-900">
                        {notification.label}
                      </h4>
                      <p className="mt-1 text-sm text-gray-500">
                        {notification.description}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setTempNotifications((prev) => ({
                        ...prev,
                        [notification.id]:
                          !prev[notification.id as keyof typeof prev],
                      }))
                    }
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 ${
                      notification.enabled ? "bg-blue-600" : "bg-gray-200"
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        notification.enabled ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 알림 방식 */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-6 py-4">
          <h3 className="text-base font-semibold text-gray-900">알림 방식</h3>
          <p className="mt-1 text-sm text-gray-500">
            알림을 받을 방법을 선택하세요
          </p>
        </div>
        <div className="divide-y divide-gray-200">
          {deliveryMethods.map((method) => {
            const Icon = method.icon;
            return (
              <div key={method.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-start">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100">
                      <Icon className="h-5 w-5 text-gray-600" />
                    </div>
                    <div className="ml-4">
                      <h4 className="text-sm font-medium text-gray-900">
                        {method.label}
                      </h4>
                      <p className="mt-1 text-sm text-gray-500">
                        {method.description}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setTempNotifications((prev) => ({
                        ...prev,
                        [method.id]: !prev[method.id as keyof typeof prev],
                      }))
                    }
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 ${
                      method.enabled ? "bg-blue-600" : "bg-gray-200"
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        method.enabled ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 방해 금지 시간 */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-start">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-purple-100">
                <Clock className="h-5 w-5 text-purple-600" />
              </div>
              <div className="ml-4">
                <h4 className="text-sm font-medium text-gray-900">
                  방해 금지 시간
                </h4>
                <p className="mt-1 text-sm text-gray-500">
                  설정된 시간에만 알림을 받습니다 (오전 9시 ~ 오후 6시)
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() =>
                setTempNotifications((prev) => ({
                  ...prev,
                  quietHours: !prev.quietHours,
                }))
              }
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 ${
                tempNotifications.quietHours ? "bg-blue-600" : "bg-gray-200"
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  tempNotifications.quietHours
                    ? "translate-x-5"
                    : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* 테스트 알림 */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <div className="px-6 py-5">
          <div className="flex items-start">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-blue-100">
              <TestTube className="h-5 w-5 text-blue-600" />
            </div>
            <div className="ml-4 flex-1">
              <h3 className="text-base font-semibold text-gray-900">
                알림 테스트
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                알림 설정을 테스트해보세요
              </p>
              <button
                onClick={handleTestNotification}
                className="mt-3 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
              >
                테스트 알림 보내기
              </button>
              <p className="mt-3 text-xs text-gray-400">
                💡 브라우저에서 알림 권한을 허용해야 푸시 알림을 받을 수
                있습니다
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

AlertsTab.displayName = "AlertsTab";
