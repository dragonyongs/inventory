// src/components/DevTools.tsx
import React, { useState, useEffect } from "react";
import {
  Trash2,
  Download,
  Upload,
  Eye,
  EyeOff,
  RefreshCw,
  Database,
  Settings,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { useWorkspaceStore } from "../stores/workspaceStore";
import { useItemsStore } from "../stores/itemsStore";
import { useMovementsStore } from "../stores/movementsStore";
import { useLotsStore } from "../stores/lotsStore";
import { useAuthStore } from "../stores/authStore";
import {
  cleanupTempKeys,
  cleanupAllWorkspaceKeys,
  cleanupWorkspaceKeys,
} from "../utils/persistNamespace";

interface StorageInfo {
  [key: string]: {
    size: string;
    type: string;
    preview: string;
    error?: string;
  };
}

export const DevTools: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [storageInfo, setStorageInfo] = useState<StorageInfo>({});

  // 스토어 상태들
  const { workspaces, currentWorkspaceId, getCurrentWorkspace } =
    useWorkspaceStore();
  const { items } = useItemsStore();
  const { byId: movements } = useMovementsStore();
  const { lots } = useLotsStore();
  const { user } = useAuthStore();

  const currentWorkspace = getCurrentWorkspace();

  const refreshStorageInfo = () => {
    const info: StorageInfo = {};

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
                  ? Object.keys(parsed).length > 0
                    ? `{${Object.keys(parsed).slice(0, 3).join(", ")}${
                        Object.keys(parsed).length > 3 ? "..." : ""
                      }}`
                    : "{empty}"
                  : String(parsed).slice(0, 50),
            };
          }
        } catch (e) {
          info[key] = {
            size: "0KB",
            type: "error",
            preview: "Parse error",
            error: "Parse error",
          };
        }
      }
    }
    setStorageInfo(info);
  };

  useEffect(() => {
    if (isVisible) {
      refreshStorageInfo();
    }
  }, [isVisible]);

  const handleClearCurrentWorkspace = () => {
    if (!currentWorkspaceId) {
      alert("현재 워크스페이스가 없습니다.");
      return;
    }

    if (
      confirm(
        `"${currentWorkspace?.name}" 워크스페이스의 데이터를 삭제하시겠습니까?`
      )
    ) {
      const removedCount = cleanupWorkspaceKeys(currentWorkspaceId);

      // 현재 워크스페이스 아이템만 삭제
      const currentItems = Object.values(items).filter(
        (item) => item.workspaceId === currentWorkspaceId
      );
      const updatedItems = Object.fromEntries(
        Object.entries(items).filter(
          ([_, item]) => item.workspaceId !== currentWorkspaceId
        )
      );

      useItemsStore.setState({ items: updatedItems, query: "" });

      // 현재 워크스페이스 움직임만 삭제
      const updatedMovements = Object.fromEntries(
        Object.entries(movements).filter(([_, movement]) => {
          const item = items[movement.itemId];
          return item && item.workspaceId !== currentWorkspaceId;
        })
      );

      useMovementsStore.setState({ byId: updatedMovements, query: "" });

      alert(
        `워크스페이스 데이터 삭제 완료: ${currentItems.length}개 아이템, ${removedCount}개 저장소 키`
      );
      refreshStorageInfo();
    }
  };

  const handleClearAllData = () => {
    if (confirm("⚠️ 모든 데이터를 삭제하시겠습니까? (복구 불가능)")) {
      const removedCount = cleanupAllWorkspaceKeys();

      // 모든 스토어들 리셋
      useWorkspaceStore.setState({
        workspaces: [],
        currentWorkspaceId: null,
        isInitialized: false,
      });
      useItemsStore.setState({ items: {}, query: "" });
      useMovementsStore.setState({ byId: {}, query: "" });
      useLotsStore.setState({ lots: {} });

      // auth-storage도 초기화할지 확인
      if (confirm("사용자 로그인 정보도 삭제하시겠습니까? (로그아웃됩니다)")) {
        localStorage.removeItem("auth-storage");
      }

      alert(`모든 데이터 삭제 완료: ${removedCount}개 저장소 키`);
      refreshStorageInfo();

      // 페이지 새로고침하여 완전 초기화
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  };

  const handleCleanupTempKeys = () => {
    const removedCount = cleanupTempKeys();
    alert(`임시 키 정리 완료: ${removedCount}개 삭제`);
    refreshStorageInfo();
  };

  const handleExportData = () => {
    const exportData = {
      timestamp: new Date().toISOString(),
      version: "2.0",
      user: user,
      workspaces: workspaces,
      items: items,
      movements: movements,
      lots: lots,
      storage: storageInfo,
      currentWorkspaceId: currentWorkspaceId,
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

    alert("데이터 내보내기 완료");
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
            `백업 데이터를 복원하시겠습니까?\n` +
              `백업 날짜: ${new Date(
                importData.timestamp
              ).toLocaleString()}\n` +
              `워크스페이스: ${importData.workspaces?.length || 0}개\n` +
              `아이템: ${Object.keys(importData.items || {}).length}개\n\n` +
              `현재 데이터는 덮어씌워집니다.`
          )
        ) {
          // 스토어들에 데이터 복원
          if (importData.workspaces) {
            useWorkspaceStore.setState({
              workspaces: importData.workspaces,
              currentWorkspaceId:
                importData.currentWorkspaceId ||
                importData.workspaces[0]?.id ||
                null,
              isInitialized: true,
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

          // 페이지 새로고침하여 완전 적용
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        }
      } catch (error) {
        alert("백업 파일 형식이 올바르지 않습니다.");
        console.error("Import error:", error);
      }
    };
    reader.readAsText(file);

    // 파일 입력 초기화
    event.target.value = "";
  };

  const handleForceRefresh = () => {
    if (confirm("페이지를 새로고침하시겠습니까?")) {
      window.location.reload();
    }
  };

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-purple-600 text-white p-3 rounded-full shadow-lg hover:bg-purple-700 z-50 transition-colors"
        title="개발자 도구"
      >
        <Settings className="h-5 w-5" />
      </button>
    );
  }

  const totalStorageSize = Object.values(storageInfo).reduce(
    (total, info) => total + parseFloat(info.size.replace("KB", "") || "0"),
    0
  );

  const inventoryKeys = Object.keys(storageInfo).filter(
    (key) => key.startsWith("inventory-") || key.includes("auth-storage")
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <Settings className="h-6 w-6 mr-2" />
            개발자 도구
          </h2>
          <button
            onClick={() => setIsVisible(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <EyeOff className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* 현재 상태 정보 */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-3">현재 상태</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-500">사용자:</span>
                <div className="font-medium">{user?.email || "미로그인"}</div>
              </div>
              <div>
                <span className="text-gray-500">워크스페이스:</span>
                <div className="font-medium">{workspaces.length}개</div>
              </div>
              <div>
                <span className="text-gray-500">아이템:</span>
                <div className="font-medium">{Object.keys(items).length}개</div>
              </div>
              <div>
                <span className="text-gray-500">움직임:</span>
                <div className="font-medium">
                  {Object.keys(movements).length}개
                </div>
              </div>
            </div>

            {currentWorkspace && (
              <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-200">
                <div className="text-sm">
                  <span className="text-blue-700 font-medium">
                    현재 워크스페이스:
                  </span>
                  <span className="ml-2">{currentWorkspace.name}</span>
                  <span className="ml-2 text-blue-600">
                    ({currentWorkspaceId})
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* 스토리지 정보 */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-3">스토리지 정보</h3>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-500">전체 항목:</span>
                <div className="font-medium">
                  {Object.keys(storageInfo).length}개
                </div>
              </div>
              <div>
                <span className="text-gray-500">재고관리 키:</span>
                <div className="font-medium">{inventoryKeys.length}개</div>
              </div>
              <div>
                <span className="text-gray-500">전체 크기:</span>
                <div className="font-medium">
                  {totalStorageSize.toFixed(2)}KB
                </div>
              </div>
            </div>
          </div>

          {/* 액션 버튼들 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <button
              onClick={handleForceRefresh}
              className="flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              새로고침
            </button>

            <button
              onClick={handleCleanupTempKeys}
              className="flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              임시 키 정리
            </button>

            <button
              onClick={handleClearCurrentWorkspace}
              className="flex items-center justify-center px-4 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
              disabled={!currentWorkspaceId}
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              현재 WS 삭제
            </button>

            <button
              onClick={handleClearAllData}
              className="flex items-center justify-center px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              모든 데이터 삭제
            </button>
          </div>

          {/* 백업/복원 */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleExportData}
              className="flex items-center justify-center px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Download className="h-4 w-4 mr-2" />
              데이터 내보내기
            </button>

            <label className="flex items-center justify-center px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors cursor-pointer">
              <Upload className="h-4 w-4 mr-2" />
              데이터 가져오기
              <input
                type="file"
                accept=".json"
                onChange={handleImportData}
                className="hidden"
              />
            </label>
          </div>

          {/* 상세 정보 토글 */}
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center justify-center w-full px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            {showDetails ? (
              <EyeOff className="h-4 w-4 mr-2" />
            ) : (
              <Eye className="h-4 w-4 mr-2" />
            )}
            {showDetails ? "상세 정보 숨기기" : "상세 정보 보기"}
          </button>

          {/* 스토리지 상세 정보 */}
          {showDetails && Object.keys(storageInfo).length > 0 && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-3">
                스토리지 상세 정보
              </h3>
              <div className="max-h-96 overflow-y-auto">
                <div className="space-y-2">
                  {Object.entries(storageInfo)
                    .sort(([a], [b]) => {
                      // inventory- 키들을 먼저 보여주기
                      if (
                        a.startsWith("inventory-") &&
                        !b.startsWith("inventory-")
                      )
                        return -1;
                      if (
                        !a.startsWith("inventory-") &&
                        b.startsWith("inventory-")
                      )
                        return 1;
                      return a.localeCompare(b);
                    })
                    .map(([key, info]) => (
                      <div
                        key={key}
                        className={`p-3 rounded border text-sm ${
                          key.startsWith("inventory-")
                            ? "bg-blue-50 border-blue-200"
                            : "bg-white border-gray-200"
                        }`}
                      >
                        <div className="font-medium text-gray-900 mb-1">
                          {key}
                        </div>
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>{info.type}</span>
                          <span>{info.size}</span>
                        </div>
                        <div className="text-xs text-gray-600 mt-1 truncate">
                          {info.error ? (
                            <span className="text-red-600">{info.error}</span>
                          ) : (
                            info.preview
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* 닫기 버튼 */}
          <button
            onClick={() => setIsVisible(false)}
            className="w-full px-4 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

export default DevTools;
