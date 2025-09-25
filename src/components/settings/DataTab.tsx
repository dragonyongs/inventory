// src/pages/settings/DataTab.tsx - 오류 수정 버전
import React, { useCallback, useState, useMemo } from "react";
import {
  Database,
  Download,
  Upload,
  Trash2,
  RefreshCw,
  FileText,
  Archive,
  AlertCircle,
  X,
  HardDrive,
  Cloud,
  Shield,
  Clock,
  BarChart3,
} from "lucide-react";
import { useItemsStore } from "../../stores/itemsStore";
import { useMovementsStore } from "../../stores/movementsStore";
import { useLotsStore } from "../../stores/lotsStore";
import { useOutboxStore } from "../../stores/outboxStore";
import { useWorkspaceStore } from "../../stores/workspaceStore";
import { useItemList, useMovementList } from "../../stores/selectors";

interface ExportData {
  items: any[];
  movements: any[];
  lots: any[];
  workspace: any;
  exportedAt: string;
  version: string;
}

interface BackupStats {
  totalItems: number;
  totalMovements: number;
  totalLots: number;
  pendingSync: number;
  lastBackup: string | null;
  dataSize: string;
}

export const DataTab: React.FC = React.memo(() => {
  const [isLoading, setIsLoading] = useState(false);
  const [lastAction, setLastAction] = useState<
    "export" | "import" | "clear" | null
  >(null);
  const [showConfirmModal, setShowConfirmModal] = useState<
    "clear" | "reset" | null
  >(null);

  // Store 접근 - 안전하게 처리
  const itemsStore = useItemsStore();
  const movementsStore = useMovementsStore();
  const lotsStore = useLotsStore();
  const outboxStore = useOutboxStore();
  const workspaceStore = useWorkspaceStore();

  // 데이터 가져오기 - 안전하게 처리
  const items = useItemList() || [];
  const movements = useMovementList() || [];
  const { currentWorkspaceId, workspaces } = workspaceStore;
  const currentWorkspace =
    currentWorkspaceId && workspaces
      ? (workspaces as Record<string, any>)[currentWorkspaceId]
      : null;

  // 통계 계산 - 안전하게 처리
  const backupStats: BackupStats = useMemo(() => {
    // 🔧 수정: 안전한 객체 접근
    const outboxItems = (outboxStore as any)?.items || {};
    const lotsData = lotsStore?.lots || {};

    const pendingCount = Object.keys(outboxItems).length;
    const lastBackupStr = localStorage.getItem("lastDataBackup");

    // 데이터 크기 추정 (KB 단위) - 안전하게 처리
    const dataSize = (() => {
      try {
        const itemsSize = JSON.stringify(items || []).length;
        const movementsSize = JSON.stringify(movements || []).length;
        const totalBytes = itemsSize + movementsSize;
        const totalKB = Math.round(totalBytes / 1024);
        return totalKB < 1024
          ? `${totalKB} KB`
          : `${Math.round(totalKB / 1024)} MB`;
      } catch (error) {
        console.warn("데이터 크기 계산 실패:", error);
        return "계산 중...";
      }
    })();

    return {
      totalItems: Array.isArray(items) ? items.length : 0,
      totalMovements: Array.isArray(movements) ? movements.length : 0,
      totalLots: Object.keys(lotsData).length,
      pendingSync: pendingCount,
      lastBackup: lastBackupStr,
      dataSize,
    };
  }, [items, movements, lotsStore?.lots, outboxStore]);

  // 데이터 내보내기 - 안전하게 처리
  const handleExportData = useCallback(async () => {
    setIsLoading(true);
    setLastAction("export");

    try {
      const exportData: ExportData = {
        items: items || [],
        movements: movements || [],
        lots: Object.values(lotsStore?.lots || {}),
        workspace: currentWorkspace,
        exportedAt: new Date().toISOString(),
        version: "1.0.0",
      };

      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `inventory-backup-${
        new Date().toISOString().split("T")[0]
      }.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // 백업 시간 저장
      localStorage.setItem("lastDataBackup", new Date().toISOString());

      console.log("데이터 내보내기 완료");
    } catch (error) {
      console.error("데이터 내보내기 실패:", error);
      alert("데이터 내보내기에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [items, movements, lotsStore?.lots, currentWorkspace]);

  // 데이터 가져오기 - 안전하게 처리
  const handleImportData = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setIsLoading(true);
      setLastAction("import");

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const jsonString = e.target?.result as string;
          const importData: ExportData = JSON.parse(jsonString);

          // 데이터 검증
          if (!importData.items || !Array.isArray(importData.items)) {
            throw new Error("유효하지 않은 데이터 형식입니다.");
          }

          // 현재 워크스페이스 ID로 데이터 가져오기
          if (currentWorkspaceId && itemsStore && movementsStore) {
            // 아이템 가져오기
            importData.items.forEach((item) => {
              itemsStore.addItem({
                ...item,
                id: `imported_${Date.now()}_${Math.random()
                  .toString(36)
                  .substr(2, 9)}`,
                workspaceId: currentWorkspaceId,
              });
            });

            // 움직임 가져오기
            if (importData.movements && Array.isArray(importData.movements)) {
              importData.movements.forEach((movement) => {
                movementsStore.addMovement({
                  ...movement,
                  id: `imported_${Date.now()}_${Math.random()
                    .toString(36)
                    .substr(2, 9)}`,
                  workspaceId: currentWorkspaceId,
                });
              });
            }
          }

          alert("데이터 가져오기가 완료되었습니다.");
          console.log("데이터 가져오기 완료");
        } catch (error) {
          console.error("데이터 가져오기 실패:", error);
          alert("데이터 가져오기에 실패했습니다. 파일을 확인해주세요.");
        } finally {
          setIsLoading(false);
        }
      };

      reader.onerror = () => {
        setIsLoading(false);
        alert("파일 읽기에 실패했습니다.");
      };

      reader.readAsText(file);
      event.target.value = ""; // 파일 입력 초기화
    },
    [currentWorkspaceId, itemsStore, movementsStore]
  );

  // CSV 내보내기 - 안전하게 처리
  const handleExportCSV = useCallback(() => {
    if (!Array.isArray(items) || items.length === 0) {
      alert("내보낼 데이터가 없습니다.");
      return;
    }

    setIsLoading(true);
    try {
      const csvData = [
        ["ID", "상품명", "SKU", "재고량", "최소재고", "단위", "생성일"],
        ...items.map((item) => [
          item.id || "",
          item.name || "",
          item.sku || "",
          (item.stock || 0).toString(),
          (item.minStock || 0).toString(),
          (item as any).unit || "EA",
          item.createdAt
            ? new Date(item.createdAt).toLocaleDateString("ko-KR")
            : "",
        ]),
      ];

      const csvContent = csvData
        .map((row) => row.map((field) => `"${field}"`).join(","))
        .join("\n");

      const blob = new Blob(["\uFEFF" + csvContent], {
        type: "text/csv;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `inventory-items-${
        new Date().toISOString().split("T")[0]
      }.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      console.log("CSV 내보내기 완료");
    } catch (error) {
      console.error("CSV 내보내기 실패:", error);
      alert("CSV 내보내기에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [items]);

  // 데이터 초기화 - 안전하게 처리
  const handleClearData = useCallback(() => {
    if (!currentWorkspaceId || !itemsStore || !movementsStore) {
      alert("현재 워크스페이스를 찾을 수 없습니다.");
      return;
    }

    try {
      // 현재 워크스페이스의 데이터만 삭제
      const allItems = Object.values(itemsStore.items || {});
      allItems
        .filter((item) => item?.workspaceId === currentWorkspaceId)
        .forEach((item) => (itemsStore as any).deleteItem(item.id));

      const allMovements = Object.values(
        (movementsStore as any).movements || {}
      );
      allMovements
        .filter((movement: any) => movement?.workspaceId === currentWorkspaceId)
        .forEach((movement: any) =>
          (movementsStore as any).deleteMovement(movement.id)
        );

      alert("현재 워크스페이스 데이터가 초기화되었습니다.");
      console.log("현재 워크스페이스 데이터 초기화 완료");
    } catch (error) {
      console.error("데이터 초기화 실패:", error);
      alert("데이터 초기화에 실패했습니다.");
    }
    setShowConfirmModal(null);
  }, [currentWorkspaceId, itemsStore, movementsStore]);

  // 전체 앱 데이터 초기화
  const handleResetApp = useCallback(() => {
    try {
      // 모든 로컬 스토리지 데이터 초기화
      localStorage.clear();

      // 페이지 새로고침으로 완전 초기화
      window.location.reload();
    } catch (error) {
      console.error("앱 초기화 실패:", error);
      alert("앱 초기화에 실패했습니다.");
    }
  }, []);

  // 동기화 상태 새로고침
  const handleRefreshSync = useCallback(() => {
    setIsLoading(true);
    // 실제로는 서버와 동기화 로직 실행
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  }, []);

  return (
    <div className="space-y-6">
      {/* 데이터 통계 카드들 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">총 상품</p>
              <p className="text-2xl font-bold text-blue-600">
                {backupStats.totalItems}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-xl">
              <Database className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">총 기록</p>
              <p className="text-2xl font-bold text-green-600">
                {backupStats.totalMovements}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-xl">
              <BarChart3 className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">
                동기화 대기
              </p>
              <p
                className={`text-2xl font-bold ${
                  backupStats.pendingSync > 0
                    ? "text-orange-600"
                    : "text-gray-400"
                }`}
              >
                {backupStats.pendingSync}
              </p>
            </div>
            <div
              className={`p-3 rounded-xl ${
                backupStats.pendingSync > 0 ? "bg-orange-100" : "bg-gray-100"
              }`}
            >
              <Cloud
                className={`w-5 h-5 ${
                  backupStats.pendingSync > 0
                    ? "text-orange-600"
                    : "text-gray-400"
                }`}
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">
                데이터 크기
              </p>
              <p className="text-2xl font-bold text-purple-600">
                {backupStats.dataSize}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-xl">
              <HardDrive className="w-5 h-5 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* 백업 및 복원 */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Archive className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                백업 및 복원
              </h2>
              <p className="text-sm text-gray-600">
                데이터를 안전하게 백업하고 복원하세요
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 내보내기 섹션 */}
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900 flex items-center space-x-2">
                <Download className="w-4 h-4" />
                <span>데이터 내보내기</span>
              </h3>

              <button
                onClick={handleExportData}
                disabled={isLoading || backupStats.totalItems === 0}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading && lastAction === "export" ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                전체 데이터 백업 (JSON)
              </button>

              <button
                onClick={handleExportCSV}
                disabled={isLoading || backupStats.totalItems === 0}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FileText className="w-4 h-4" />
                상품 목록 내보내기 (CSV)
              </button>

              {backupStats.lastBackup && (
                <p className="text-xs text-gray-500 flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>
                    마지막 백업:{" "}
                    {new Date(backupStats.lastBackup).toLocaleString("ko-KR")}
                  </span>
                </p>
              )}
            </div>

            {/* 가져오기 섹션 */}
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900 flex items-center space-x-2">
                <Upload className="w-4 h-4" />
                <span>데이터 가져오기</span>
              </h3>

              <label className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 text-gray-700 rounded-lg hover:border-blue-400 hover:text-blue-600 cursor-pointer transition-colors">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportData}
                  className="hidden"
                  disabled={isLoading}
                />
                {isLoading && lastAction === "import" ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                백업 파일 복원 (JSON)
              </label>

              <div className="p-3 bg-yellow-50 rounded-lg">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-yellow-800">
                    데이터 복원 시 기존 데이터와 중복될 수 있습니다. 필요한 경우
                    먼저 현재 데이터를 백업해주세요.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 동기화 상태 */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Cloud className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  동기화 상태
                </h2>
                <p className="text-sm text-gray-600">
                  클라우드 동기화 및 오프라인 데이터 관리
                </p>
              </div>
            </div>
            <button
              onClick={handleRefreshSync}
              disabled={isLoading}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              title="동기화 상태 새로고침"
            >
              <RefreshCw
                className={`w-5 h-5 ${isLoading ? "animate-spin" : ""}`}
              />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <div
                className={`w-3 h-3 rounded-full ${
                  backupStats.pendingSync === 0
                    ? "bg-green-500"
                    : "bg-orange-500"
                }`}
              />
              <div>
                <p className="font-medium text-gray-900">
                  {backupStats.pendingSync === 0
                    ? "모든 데이터 동기화됨"
                    : `${backupStats.pendingSync}개 항목 동기화 대기 중`}
                </p>
                <p className="text-sm text-gray-600">
                  {backupStats.pendingSync === 0
                    ? "로컬 데이터가 클라우드와 동기화되었습니다."
                    : "인터넷 연결 시 자동으로 동기화됩니다."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 데이터 관리 */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <Shield className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                데이터 관리
              </h2>
              <p className="text-sm text-gray-600">
                위험 구역: 데이터 초기화 및 앱 재설정
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <h3 className="font-medium text-gray-900">
                  현재 워크스페이스 데이터 초기화
                </h3>
                <p className="text-sm text-gray-600">
                  현재 워크스페이스의 모든 상품과 기록을 삭제합니다
                </p>
              </div>
              <button
                onClick={() => setShowConfirmModal("clear")}
                disabled={
                  backupStats.totalItems === 0 &&
                  backupStats.totalMovements === 0
                }
                className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-4 h-4" />
                데이터 초기화
              </button>
            </div>

            <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50">
              <div>
                <h3 className="font-medium text-red-900">
                  전체 앱 데이터 초기화
                </h3>
                <p className="text-sm text-red-700">
                  모든 워크스페이스, 설정, 데이터를 완전히 삭제합니다
                </p>
              </div>
              <button
                onClick={() => setShowConfirmModal("reset")}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <X className="w-4 h-4" />앱 초기화
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 확인 모달 */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <div className="text-center">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${
                  showConfirmModal === "reset" ? "bg-red-100" : "bg-orange-100"
                }`}
              >
                <AlertCircle
                  className={`w-6 h-6 ${
                    showConfirmModal === "reset"
                      ? "text-red-600"
                      : "text-orange-600"
                  }`}
                />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {showConfirmModal === "reset"
                  ? "앱 전체 초기화"
                  : "워크스페이스 데이터 초기화"}
              </h3>
              <p className="text-gray-600 mb-6">
                {showConfirmModal === "reset"
                  ? "모든 워크스페이스와 데이터가 완전히 삭제됩니다. 이 작업은 되돌릴 수 없습니다."
                  : "현재 워크스페이스의 모든 상품과 기록이 삭제됩니다. 이 작업은 되돌릴 수 없습니다."}
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowConfirmModal(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={
                    showConfirmModal === "reset"
                      ? handleResetApp
                      : handleClearData
                  }
                  className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors ${
                    showConfirmModal === "reset"
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-orange-600 hover:bg-orange-700"
                  }`}
                >
                  {showConfirmModal === "reset" ? "앱 초기화" : "데이터 초기화"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

DataTab.displayName = "DataTab";
