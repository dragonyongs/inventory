// src/components/settings/GeneralTab.tsx
import React, { useCallback, useState, useEffect, useRef } from "react";
import { AlertTriangle, Package, Zap, Palette, Check } from "lucide-react";
import { useSettingsStore } from "../../stores/settingsStore";

export const GeneralTab: React.FC = React.memo(() => {
  const settings = useSettingsStore();
  const isInitialMount = useRef(true);

  const [tempSettings, setTempSettings] = useState({
    expiringDays: settings.expiringDays,
    pageSize: settings.pageSize,
    updateMode: settings.updateMode,
    theme: settings.theme || "light",
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 변경사항 감지만
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const changed =
      tempSettings.expiringDays !== settings.expiringDays ||
      tempSettings.pageSize !== settings.pageSize ||
      tempSettings.updateMode !== settings.updateMode ||
      (tempSettings.theme || "light") !== (settings.theme || "light");

    setHasChanges(changed);
  }, [
    tempSettings,
    settings.expiringDays,
    settings.pageSize,
    settings.updateMode,
    settings.theme,
  ]);

  const handleSave = useCallback(async () => {
    setIsLoading(true);
    try {
      settings.setExpiringDays(tempSettings.expiringDays);
      settings.setPageSize(tempSettings.pageSize);
      settings.setUpdateMode(tempSettings.updateMode);
      if (settings.setTheme) {
        settings.setTheme(tempSettings.theme);
      }
      setHasChanges(false);
    } catch (error) {
      console.error("설정 저장 실패:", error);
    } finally {
      setIsLoading(false);
    }
  }, [settings, tempSettings]);

  const handleReset = useCallback(() => {
    setTempSettings({
      expiringDays: settings.expiringDays,
      pageSize: settings.pageSize,
      updateMode: settings.updateMode,
      theme: settings.theme || "light",
    });
    setHasChanges(false);
  }, [settings]);

  return (
    <div className="space-y-6">
      {/* 저장 알림 바 */}
      {hasChanges && (
        <div className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">
              변경사항이 저장되지 않았습니다
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

      {/* 유통기한 알림 */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <div className="px-6 py-5">
          <div className="flex items-start">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-orange-100">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
            </div>
            <div className="ml-4 flex-1">
              <h3 className="text-base font-semibold text-gray-900">
                유통기한 알림
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                이 기간 내에 만료되는 상품에 대해 알림을 표시합니다
              </p>
              <div className="mt-4 flex items-center space-x-2">
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={tempSettings.expiringDays}
                  onChange={(e) =>
                    setTempSettings((prev) => ({
                      ...prev,
                      expiringDays: Number(e.target.value),
                    }))
                  }
                  className="w-20 rounded-md border-gray-300 text-center text-sm shadow-sm transition-all focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600">일</span>
              </div>
              <p className="mt-2 text-xs text-gray-400">
                {tempSettings.expiringDays}일 내에 만료되는 상품에 대해 알림을
                표시합니다
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 페이징 설정 */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <div className="px-6 py-5">
          <div className="flex items-start">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-blue-100">
              <Package className="h-5 w-5 text-blue-600" />
            </div>
            <div className="ml-4 flex-1">
              <h3 className="text-base font-semibold text-gray-900">
                페이징 설정
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                페이지당 표시할 항목 수를 설정합니다
              </p>
              <div className="mt-4">
                <select
                  value={tempSettings.pageSize}
                  onChange={(e) =>
                    setTempSettings((prev) => ({
                      ...prev,
                      pageSize: Number(e.target.value),
                    }))
                  }
                  className="block w-full max-w-xs rounded-md border-gray-300 text-sm shadow-sm transition-all focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  <option value={10}>10개</option>
                  <option value={20}>20개</option>
                  <option value={50}>50개</option>
                  <option value={100}>100개</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 업데이트 모드 */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <div className="px-6 py-5">
          <div className="flex items-start">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-green-100">
              <Zap className="h-5 w-5 text-green-600" />
            </div>
            <div className="ml-4 flex-1">
              <h3 className="text-base font-semibold text-gray-900">
                업데이트 모드
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                새 버전이 있을 때 업데이트 방식을 선택하세요
              </p>
              <div className="mt-4 space-y-3">
                {[
                  {
                    value: "auto",
                    label: "자동 업데이트",
                    desc: "새 버전이 있으면 자동으로 업데이트합니다",
                  },
                  {
                    value: "manual",
                    label: "수동 업데이트",
                    desc: "수동으로 업데이트를 확인하고 적용합니다",
                  },
                ].map((mode) => (
                  <label
                    key={mode.value}
                    className={`relative flex cursor-pointer rounded-lg border p-4 transition-all ${
                      tempSettings.updateMode === mode.value
                        ? "border-blue-600 bg-blue-50"
                        : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="updateMode"
                      value={mode.value}
                      checked={tempSettings.updateMode === mode.value}
                      onChange={(e) =>
                        setTempSettings((prev) => ({
                          ...prev,
                          updateMode: e.target.value as "auto" | "manual",
                        }))
                      }
                      className="h-4 w-4 flex-shrink-0 border-gray-300 text-blue-600 focus:ring-blue-600"
                    />
                    <div className="ml-3 flex-1">
                      <span
                        className={`block text-sm font-medium ${
                          tempSettings.updateMode === mode.value
                            ? "text-blue-900"
                            : "text-gray-900"
                        }`}
                      >
                        {mode.label}
                      </span>
                      <span
                        className={`mt-1 block text-sm ${
                          tempSettings.updateMode === mode.value
                            ? "text-blue-700"
                            : "text-gray-500"
                        }`}
                      >
                        {mode.desc}
                      </span>
                    </div>
                    {tempSettings.updateMode === mode.value && (
                      <Check className="ml-3 h-5 w-5 flex-shrink-0 text-blue-600" />
                    )}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 테마 설정 */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <div className="px-6 py-5">
          <div className="flex items-start">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-purple-100">
              <Palette className="h-5 w-5 text-purple-600" />
            </div>
            <div className="ml-4 flex-1">
              <h3 className="text-base font-semibold text-gray-900">앱 테마</h3>
              <p className="mt-1 text-sm text-gray-500">
                앱의 외관 테마를 선택하세요
              </p>
              <div className="mt-4 grid grid-cols-3 gap-3">
                {[
                  { value: "light", label: "라이트", icon: "☀️" },
                  { value: "dark", label: "다크", icon: "🌙" },
                  { value: "auto", label: "시스템", icon: "💻" },
                ].map((theme) => (
                  <button
                    key={theme.value}
                    onClick={() =>
                      setTempSettings((prev) => ({
                        ...prev,
                        theme: theme.value as "light" | "dark" | "auto",
                      }))
                    }
                    className={`relative flex flex-col items-center justify-center rounded-lg border p-4 transition-all ${
                      tempSettings.theme === theme.value
                        ? "border-blue-600 bg-blue-50"
                        : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <span className="text-2xl">{theme.icon}</span>
                    <span
                      className={`mt-2 text-sm font-medium ${
                        tempSettings.theme === theme.value
                          ? "text-blue-900"
                          : "text-gray-700"
                      }`}
                    >
                      {theme.label}
                    </span>
                    {tempSettings.theme === theme.value && (
                      <div className="absolute right-2 top-2">
                        <Check className="h-4 w-4 text-blue-600" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

GeneralTab.displayName = "GeneralTab";
