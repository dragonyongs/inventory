import React, { useCallback, useState, useEffect, useRef } from "react";
import {
  AlertTriangle,
  Package,
  Zap,
  Palette,
  Check,
  Sun,
  Moon,
  Monitor,
  Save,
  RotateCcw,
} from "lucide-react";
import { useSettingsStore } from "../../stores/settingsStore";

export const GeneralTab: React.FC = React.memo(() => {
  const settings = useSettingsStore();
  const isInitialMount = useRef(true);

  const [tempSettings, setTempSettings] = useState({
    expiringDays: settings.expiringDays,
    pageSize: settings.pageSize,
    updateMode: settings.updateMode,
    theme: settings.theme || ("light" as const),
  });

  const [hasChanges, setHasChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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
      theme: settings.theme || ("light" as const),
    });
    setHasChanges(false);
  }, [settings]);

  const themeOptions = [
    {
      value: "light" as const,
      label: "라이트 모드",
      description: "밝은 테마로 표시합니다",
      icon: Sun,
    },
    {
      value: "dark" as const,
      label: "다크 모드",
      description: "어두운 테마로 표시합니다",
      icon: Moon,
    },
    {
      value: "auto" as const,
      label: "자동 설정",
      description: "기기 설정을 따릅니다",
      icon: Monitor,
    },
  ];

  const updateModeOptions = [
    {
      value: "auto" as const,
      label: "자동 업데이트",
      description: "새 버전이 있으면 자동으로 업데이트합니다",
    },
    {
      value: "manual" as const,
      label: "수동 업데이트",
      description: "업데이트를 확인 후 진행합니다",
    },
  ];

  const pageSizeOptions = [10, 20, 30, 50, 100];

  return (
    <div className="max-w-5xl mx-auto">
      {/* 헤더 */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">일반 설정</h2>
        <p className="text-sm text-gray-500">
          앱의 기본 동작과 외관을 설정하세요
        </p>
      </div>

      {/* 유통기한 임박 기준 */}
      <div className="mb-6 p-6 bg-white border border-gray-200 rounded-xl">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-gray-900 mb-1">
              유통기한 임박 기준
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              이 기간 내에 만료되는 상품에 대해 알림을 표시합니다
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <input
            type="range"
            min="1"
            max="90"
            value={tempSettings.expiringDays}
            onChange={(e) =>
              setTempSettings({
                ...tempSettings,
                expiringDays: Number(e.target.value),
              })
            }
            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-gray-900"
          />
          <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg">
            <span className="text-2xl font-semibold text-gray-900">
              {tempSettings.expiringDays}
            </span>
            <span className="text-sm text-gray-500">일</span>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-3">
          {tempSettings.expiringDays}일 내에 만료되는 상품에 대해 알림을
          표시합니다
        </p>
      </div>

      {/* 페이지 크기 */}
      <div className="mb-6 p-6 bg-white border border-gray-200 rounded-xl">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
            <Package className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-gray-900 mb-1">
              페이지당 항목 수
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              페이지당 표시할 항목 수를 설정합니다
            </p>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-3">
          {pageSizeOptions.map((size) => (
            <button
              key={size}
              onClick={() =>
                setTempSettings({ ...tempSettings, pageSize: size })
              }
              className={`px-4 py-3 text-sm font-medium rounded-lg border-2 transition-all ${
                tempSettings.pageSize === size
                  ? "border-gray-900 bg-gray-900 text-white"
                  : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      {/* 업데이트 방식 */}
      <div className="mb-6 p-6 bg-white border border-gray-200 rounded-xl">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
            <Zap className="w-5 h-5 text-purple-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-gray-900 mb-1">
              업데이트 방식
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              새 버전이 있을 때 업데이트 방식을 선택하세요
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {updateModeOptions.map((option) => (
            <button
              key={option.value}
              onClick={() =>
                setTempSettings({ ...tempSettings, updateMode: option.value })
              }
              className={`w-full flex items-start justify-between p-4 border-2 rounded-lg transition-all ${
                tempSettings.updateMode === option.value
                  ? "border-gray-900 bg-gray-50"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <div className="flex-1 min-w-0 text-left">
                <h4 className="text-sm font-medium text-gray-900 mb-1">
                  {option.label}
                </h4>
                <p className="text-xs text-gray-500">{option.description}</p>
              </div>
              {tempSettings.updateMode === option.value && (
                <Check className="w-5 h-5 text-gray-900 flex-shrink-0 ml-3" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 테마 설정 */}
      <div className="mb-6 p-6 bg-white border border-gray-200 rounded-xl">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-pink-50 flex items-center justify-center flex-shrink-0">
            <Palette className="w-5 h-5 text-pink-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-gray-900 mb-1">
              외관 테마
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              앱의 외관 테마를 선택하세요
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {themeOptions.map((option) => {
            const IconComponent = option.icon;
            return (
              <button
                key={option.value}
                onClick={() =>
                  setTempSettings({ ...tempSettings, theme: option.value })
                }
                className={`p-4 border-2 rounded-lg transition-all ${
                  tempSettings.theme === option.value
                    ? "border-gray-900 bg-gray-50"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <div className="flex flex-col items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      tempSettings.theme === option.value
                        ? "bg-gray-900 text-white"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    <IconComponent className="w-6 h-6" />
                  </div>
                  <div className="text-center">
                    <h4 className="text-sm font-medium text-gray-900 mb-1">
                      {option.label}
                    </h4>
                    <p className="text-xs text-gray-500">
                      {option.description}
                    </p>
                  </div>
                  {tempSettings.theme === option.value && (
                    <Check className="w-5 h-5 text-gray-900" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
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

GeneralTab.displayName = "GeneralTab";
