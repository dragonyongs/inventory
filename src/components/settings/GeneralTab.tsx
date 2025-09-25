// src/pages/settings/GeneralTab.tsx
import React, { useCallback, useState, useEffect } from "react";
import { AlertTriangle, Package, Zap, Settings, Check } from "lucide-react";
import { useSettingsStore } from "../../stores/settingsStore";

export const GeneralTab: React.FC = React.memo(() => {
  const settings = useSettingsStore();
  const [tempSettings, setTempSettings] = useState({
    expiringDays: settings.expiringDays,
    pageSize: settings.pageSize,
    updateMode: settings.updateMode,
    theme: settings.theme,
    notifications: settings.notifications,
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // settings 변경 감지
  useEffect(() => {
    setTempSettings({
      expiringDays: settings.expiringDays,
      pageSize: settings.pageSize,
      updateMode: settings.updateMode,
      theme: settings.theme,
      notifications: settings.notifications,
    });
  }, [
    settings.expiringDays,
    settings.pageSize,
    settings.updateMode,
    settings.theme,
    settings.notifications,
  ]);

  useEffect(() => {
    const changed = JSON.stringify(settings) !== JSON.stringify(tempSettings);
    setHasChanges(changed);
  }, [settings, tempSettings]);

  const handleSettingChange = useCallback((key: string, value: any) => {
    setTempSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSave = useCallback(async () => {
    setIsLoading(true);
    try {
      settings.setExpiringDays(tempSettings.expiringDays);
      settings.setPageSize(tempSettings.pageSize);
      settings.setUpdateMode(tempSettings.updateMode);
      settings.setTheme(tempSettings.theme);
      setHasChanges(false);
    } catch (error) {
      console.error("설정 저장 실패:", error);
    } finally {
      setIsLoading(false);
    }
  }, [settings, tempSettings]);

  const handleReset = useCallback(() => {
    setTempSettings({
      expiringDays: 30,
      pageSize: 20,
      updateMode: "auto",
      theme: "auto",
      notifications: settings.notifications,
    });
  }, [settings.notifications]);

  return (
    <div className="space-y-6">
      {/* 저장 버튼 */}
      {hasChanges && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">설정이 변경되었습니다.</p>
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

      {/* 유통기한 알림 설정 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-orange-100 rounded-lg">
            <AlertTriangle className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              유통기한 알림
            </h2>
            <p className="text-sm text-gray-600">
              이 기간 내에 만료되는 상품에 대해 알림을 표시합니다
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <span className="text-sm font-medium text-gray-700">
            유통기한 알림 기간 (일)
          </span>
          <div className="flex items-center space-x-2">
            <input
              type="number"
              min="1"
              max="365"
              value={tempSettings.expiringDays}
              onChange={(e) =>
                handleSettingChange(
                  "expiringDays",
                  parseInt(e.target.value) || 30
                )
              }
              className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center"
            />
            <span className="text-sm text-gray-500">일</span>
          </div>
        </div>

        <p className="text-sm text-gray-600 mt-4">
          {tempSettings.expiringDays}일 내에 만료되는 상품에 대해 알림을
          표시합니다
        </p>
      </div>

      {/* 페이지 설정 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Package className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">페이징 설정</h2>
            <p className="text-sm text-gray-600">
              페이지당 표시할 항목 수를 설정합니다
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <span className="text-sm font-medium text-gray-700">
            페이지당 항목 수
          </span>
          <select
            value={tempSettings.pageSize}
            onChange={(e) =>
              handleSettingChange("pageSize", parseInt(e.target.value))
            }
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value={10}>10개</option>
            <option value={20}>20개</option>
            <option value={50}>50개</option>
            <option value={100}>100개</option>
          </select>
        </div>
      </div>

      {/* 업데이트 모드 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-green-100 rounded-lg">
            <Zap className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              업데이트 모드
            </h2>
            <p className="text-sm text-gray-600">
              새 버전이 있을 때 업데이트 방식을 선택하세요
            </p>
          </div>
        </div>

        <div className="space-y-3">
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
            {
              value: "prompt",
              label: "확인 후 업데이트",
              desc: "새 버전이 있을 때 사용자에게 확인합니다",
            },
          ].map((option) => (
            <label
              key={option.value}
              className="flex items-start p-4 rounded-lg hover:bg-gray-50 cursor-pointer border border-gray-100"
            >
              <input
                type="radio"
                name="updateMode"
                value={option.value}
                checked={tempSettings.updateMode === option.value}
                onChange={(e) =>
                  handleSettingChange("updateMode", e.target.value)
                }
                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 mt-1"
              />
              <div className="ml-3">
                <div className="text-sm font-medium text-gray-900">
                  {option.label}
                </div>
                <div className="text-xs text-gray-600 mt-1">{option.desc}</div>
              </div>
            </label>
          ))}
        </div>

        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-700">
            현재 모드:{" "}
            <span className="font-medium">
              {tempSettings.updateMode === "auto" && "자동 업데이트"}
              {tempSettings.updateMode === "manual" && "수동 업데이트"}
              {tempSettings.updateMode === "prompt" && "확인 후 업데이트"}
            </span>
          </p>
          <p className="text-xs text-blue-600 mt-1">
            {tempSettings.updateMode === "auto" &&
              "새 버전이 있으면 자동으로 업데이트합니다."}
            {tempSettings.updateMode === "manual" &&
              "수동으로 업데이트를 확인하고 적용합니다."}
            {tempSettings.updateMode === "prompt" &&
              "새 버전이 있을 때 사용자에게 확인합니다."}
          </p>
        </div>
      </div>

      {/* 테마 설정 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Settings className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">테마</h2>
            <p className="text-sm text-gray-600">앱의 외관 테마를 선택하세요</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          {[
            { value: "light", label: "밝게", emoji: "☀️" },
            { value: "dark", label: "어둡게", emoji: "🌙" },
            { value: "auto", label: "자동", emoji: "🔄" },
          ].map((theme) => (
            <button
              key={theme.value}
              onClick={() => handleSettingChange("theme", theme.value)}
              className={`flex items-center space-x-2 px-4 py-3 rounded-lg border transition-colors ${
                tempSettings.theme === theme.value
                  ? "bg-blue-50 border-blue-200 text-blue-700"
                  : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
              }`}
            >
              <span>{theme.emoji}</span>
              <span className="font-medium">{theme.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
});

GeneralTab.displayName = "GeneralTab";
