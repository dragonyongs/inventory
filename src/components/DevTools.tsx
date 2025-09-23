// src/components/DevTools.tsx

import React, { useState } from "react";
import {
  Trash2,
  Download,
  Upload,
  Eye,
  EyeOff,
  RefreshCw,
  Database,
} from "lucide-react";
import { useWorkspaceStore } from "../stores/workspaceStore";
import { useItemsStore } from "../stores/itemsStore";
import { useMovementsStore } from "../stores/movementsStore";
import { useLotsStore } from "../stores/lotsStore";
import { useAuthStore } from "../stores/authStore";
import {
  cleanupTempKeys,
  cleanupAllWorkspaceKeys,
} from "../stores/persistNamespace";

export const DevTools: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [storageInfo, setStorageInfo] = useState<{ [key: string]: any }>({});

  const workspaces = useWorkspaceStore((state) => state.workspaces);
  const items = useItemsStore((state) => state.items);
  const movements = useMovementsStore((state) => state.byId);
  const lots = useLotsStore((state) => state.lots);
  const user = useAuthStore((state) => state.user);

  const refreshStorageInfo = () => {
    const info: { [key: string]: any } = {};

    // localStorage 모든 항목 조사
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        try {
          const value = localStorage.getItem(key);
          if (value) {
            const parsed = JSON.parse(value);
            info[key] = {
              size: `${Math.round((value.length / 1024) * 100) / 100}KB`,
              type: typeof parsed,
              preview:
                typeof parsed === "object"
                  ? Object.keys(parsed).join(", ")
                  : String(parsed).slice(0, 50),
            };
          }
        } catch (e) {
          info[key] = { error: "Parse error" };
        }
      }
    }

    setStorageInfo(info);
  };

  React.useEffect(() => {
    if (isVisible) {
      refreshStorageInfo();
    }
  }, [isVisible]);

  const handleClearCurrentWorkspace = () => {
    if (confirm("현재 워크스페이스 데이터를 삭제하시겠습니까?")) {
      const currentWorkspaceId =
        useWorkspaceStore.getState().currentWorkspaceId;
      const userId = user?.id;

      if (userId && currentWorkspaceId) {
        // 현재 워크스페이스 관련 키들만 삭제
        const keysToRemove = Object.keys(storageInfo).filter(
          (key) => key.includes(userId) && key.includes(currentWorkspaceId)
        );

        keysToRemove.forEach((key) => {
          localStorage.removeItem(key);
          console.log("삭제된 키:", key);
        });

        // 스토어 리셋
        useItemsStore.setState({ items: {}, query: "" });
        useMovementsStore.setState({ byId: {}, query: "" });
        useLotsStore.setState({ lots: {} });

        alert(
          `현재 워크스페이스 데이터 삭제 완료: ${keysToRemove.length}개 키`
        );
        refreshStorageInfo();
      }
    }
  };

  const handleClearAllData = () => {
    if (confirm("⚠️ 모든 데이터를 삭제하시겠습니까? (복구 불가능)")) {
      // 🔧 모든 워크스페이스 관련 데이터 삭제
      cleanupAllWorkspaceKeys();

      // auth-storage도 초기화 (선택사항 - 로그아웃 효과)
      if (confirm("사용자 로그인 정보도 삭제하시겠습니까? (로그아웃됩니다)")) {
        localStorage.removeItem("auth-storage");
      }

      // workspace-storage 초기화
      localStorage.removeItem("workspace-storage");

      // 스토어들 리셋
      useWorkspaceStore.setState({ workspaces: [], currentWorkspaceId: null });
      useItemsStore.setState({ items: {}, query: "" });
      useMovementsStore.setState({ byId: {}, query: "" });
      useLotsStore.setState({ lots: {} });

      alert("모든 데이터 삭제 완료");
      refreshStorageInfo();

      // 페이지 새로고침하여 완전 초기화
      window.location.reload();
    }
  };

  const handleCleanupTempKeys = () => {
    cleanupTempKeys();
    alert("임시 키 정리 완료");
    refreshStorageInfo();
  };

  const handleExportData = () => {
    const exportData = {
      timestamp: new Date().toISOString(),
      user: user,
      workspaces: workspaces,
      items: items,
      movements: movements,
      lots: lots,
      storage: storageInfo,
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `inventory-backup-${
      new Date().toISOString().split("T")[0]
    }.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importData = JSON.parse(e.target?.result as string);

        if (
          confirm(
            "백업 데이터를 복원하시겠습니까? 현재 데이터는 덮어씌워집니다."
          )
        ) {
          // 스토어들에 데이터 복원
          if (importData.workspaces) {
            useWorkspaceStore.setState({
              workspaces: importData.workspaces,
              currentWorkspaceId: importData.workspaces[0]?.id || null,
            });
          }
          if (importData.items) {
            useItemsStore.setState({ items: importData.items, query: "" });
          }
          if (importData.movements) {
            useMovementsStore.setState({
              byId: importData.movements,
              query: "",
            });
          }
          if (importData.lots) {
            useLotsStore.setState({ lots: importData.lots });
          }

          alert("백업 데이터 복원 완료");
          refreshStorageInfo();
        }
      } catch (error) {
        alert("백업 파일 형식이 올바르지 않습니다.");
        console.error("Import error:", error);
      }
    };
    reader.readAsText(file);
  };

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-purple-600 text-white p-3 rounded-full shadow-lg hover:bg-purple-700 z-50"
        title="개발자 도구"
      >
        <Database className="w-6 h-6" />
      </button>
    );
  }

  const totalStorageSize = Object.values(storageInfo).reduce(
    (total, info: any) => total + parseFloat(info.size || "0"),
    0
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full m-4 max-h-[90vh] overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <Database className="w-6 h-6 mr-2 text-purple-600" />
            개발자 도구
          </h2>
          <button
            onClick={() => setIsVisible(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <EyeOff className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {/* 스토리지 정보 */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-blue-600 mb-3 flex items-center">
              <Database className="w-5 h-5 mr-2" />
              스토리지 정보
            </h3>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="font-medium">
                항목 수: {Object.keys(storageInfo).length}개
              </p>
              <p className="font-medium">
                크기: {totalStorageSize.toFixed(2)}KB
              </p>
            </div>
          </div>

          {/* 액션 버튼들 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <button
              onClick={refreshStorageInfo}
              className="flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <RefreshCw className="w-5 h-5 mr-2" />
              페이지 새로고침
            </button>

            <button
              onClick={handleCleanupTempKeys}
              className="flex items-center justify-center px-4 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
            >
              <Trash2 className="w-5 h-5 mr-2" />
              임시 키 정리
            </button>

            <button
              onClick={handleClearCurrentWorkspace}
              className="flex items-center justify-center px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              <Trash2 className="w-5 h-5 mr-2" />
              현재 워크스페이스 데이터 삭제
            </button>

            <button
              onClick={handleClearAllData}
              className="flex items-center justify-center px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Trash2 className="w-5 h-5 mr-2" />
              모든 데이터 삭제
            </button>
          </div>

          {/* 백업/복원 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <button
              onClick={handleExportData}
              className="flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="w-5 h-5 mr-2" />
              데이터 내보내기
            </button>

            <label className="flex items-center justify-center px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors cursor-pointer">
              <Upload className="w-5 h-5 mr-2" />
              데이터 가져오기
              <input
                type="file"
                accept=".json"
                onChange={handleImportData}
                className="hidden"
              />
            </label>
          </div>

          {/* 상세 정보 보기 버튼 */}
          <button
            onClick={() => setIsVisible(false)}
            className="flex items-center justify-center w-full px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Eye className="w-5 h-5 mr-2" />
            상세 정보 보기
          </button>

          {/* 스토리지 상세 정보 */}
          {Object.keys(storageInfo).length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-3">스토리지 상세 정보</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {Object.entries(storageInfo).map(
                  ([key, info]: [string, any]) => (
                    <div
                      key={key}
                      className="bg-gray-50 p-3 rounded border text-sm"
                    >
                      <div className="font-mono text-xs text-gray-600">
                        {key}
                      </div>
                      <div className="mt-1">
                        <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs mr-2">
                          {info.size}
                        </span>
                        <span className="text-gray-600">{info.preview}</span>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DevTools;
