import React, { useState, useMemo, useCallback } from "react";
import {
  Download,
  Upload,
  AlertCircle,
  CheckCircle,
  Package,
  TrendingUp,
  HardDrive,
  Clock,
  RefreshCw,
} from "lucide-react";
import { useItemsStore } from "../../stores/itemsStore";
import { useMovementsStore } from "../../stores/movementsStore";
import { useWorkspaceStore } from "../../stores/workspaceStore";

type ConfirmModalType = "clear" | "reset" | null;

export const DataTab: React.FC = React.memo(() => {
  const itemsStore = useItemsStore();
  const movementsStore = useMovementsStore();
  const workspaceStore = useWorkspaceStore();

  const [showConfirmModal, setShowConfirmModal] =
    useState<ConfirmModalType>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const currentWorkspaceId = workspaceStore.currentWorkspaceId;

  const backupStats = useMemo(() => {
    const items = itemsStore.getWorkspaceItems();
    const movements = movementsStore.getWorkspaceMovements(); // ✅ 워크스페이스별 movements

    const dataSize = new Blob([JSON.stringify({ items, movements })]).size;

    return {
      totalItems: items.length,
      totalMovements: movements.length,
      pendingSync: 0,
      dataSize: `${(dataSize / 1024).toFixed(2)} KB`,
    };
  }, [itemsStore.items, movementsStore.byId, currentWorkspaceId]); // ✅ currentWorkspaceId 의존성 추가

  const handleBackup = useCallback(() => {
    try {
      setIsProcessing(true);
      const items = itemsStore.getWorkspaceItems();
      const movements = movementsStore.getWorkspaceMovements();

      const backupData = {
        version: "1.0",
        timestamp: new Date().toISOString(),
        workspaceId: currentWorkspaceId,
        data: { items, movements },
      };

      const blob = new Blob([JSON.stringify(backupData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `backup-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      alert("백업이 완료되었습니다.");
    } catch (error) {
      console.error("백업 실패:", error);
      alert("백업에 실패했습니다.");
    } finally {
      setIsProcessing(false);
    }
  }, [itemsStore, movementsStore, currentWorkspaceId]);

  const handleRestore = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setIsProcessing(true);
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const backupData = JSON.parse(e.target?.result as string);

          if (backupData.data?.items) {
            backupData.data.items.forEach((item: any) => {
              itemsStore.upsert(item);
            });
          }

          if (backupData.data?.movements) {
            backupData.data.movements.forEach((movement: any) => {
              movementsStore.addMovement(movement);
            });
          }

          alert("데이터 복원이 완료되었습니다.");
        } catch (error) {
          console.error("복원 실패:", error);
          alert("데이터 복원에 실패했습니다. 파일을 확인해주세요.");
        } finally {
          setIsProcessing(false);
          event.target.value = "";
        }
      };

      reader.readAsText(file);
    },
    [itemsStore, movementsStore]
  );

  const handleClearData = useCallback(() => {
    if (!currentWorkspaceId) return;

    setIsProcessing(true);
    try {
      const items = itemsStore.getWorkspaceItems();
      const movements = movementsStore.getWorkspaceMovements();

      // ✅ 아이템 삭제
      items.forEach((item) =>
        itemsStore.removeItem(item.id, "워크스페이스 데이터 초기화")
      );

      // ✅ movements 삭제 - removeMovement 메서드 사용
      movements.forEach((movement) => {
        movementsStore.removeMovement(movement.id);
      });

      alert("워크스페이스 데이터가 삭제되었습니다.");
    } catch (error) {
      console.error("데이터 삭제 실패:", error);
      alert("데이터 삭제에 실패했습니다.");
    } finally {
      setIsProcessing(false);
      setShowConfirmModal(null);
    }
  }, [currentWorkspaceId, itemsStore, movementsStore]);

  const handleReset = useCallback(() => {
    setIsProcessing(true);
    try {
      localStorage.clear();
      window.location.reload();
    } catch (error) {
      console.error("초기화 실패:", error);
      alert("초기화에 실패했습니다.");
      setIsProcessing(false);
    }
  }, []);

  return (
    <div className="max-w-5xl mx-auto">
      {/* 헤더 */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          데이터 관리
        </h2>
        <p className="text-sm text-gray-500">
          데이터를 안전하게 백업하고 복원하세요
        </p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="p-5 bg-white border border-gray-200 rounded-xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-sm font-medium text-gray-600">총 상품</span>
          </div>
          <p className="text-2xl font-semibold text-gray-900">
            {backupStats.totalItems}
          </p>
        </div>

        <div className="p-5 bg-white border border-gray-200 rounded-xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-sm font-medium text-gray-600">총 기록</span>
          </div>
          <p className="text-2xl font-semibold text-gray-900">
            {backupStats.totalMovements}
          </p>
        </div>

        <div className="p-5 bg-white border border-gray-200 rounded-xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
            <span className="text-sm font-medium text-gray-600">
              동기화 대기
            </span>
          </div>
          <p
            className={`text-2xl font-semibold ${
              backupStats.pendingSync > 0 ? "text-orange-600" : "text-green-600"
            }`}
          >
            {backupStats.pendingSync}
          </p>
        </div>

        <div className="p-5 bg-white border border-gray-200 rounded-xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
              <HardDrive className="w-5 h-5 text-gray-600" />
            </div>
            <span className="text-sm font-medium text-gray-600">
              데이터 크기
            </span>
          </div>
          <p className="text-2xl font-semibold text-gray-900">
            {backupStats.dataSize}
          </p>
        </div>
      </div>

      {/* 백업/복원 섹션 */}
      <div className="mb-6 p-6 bg-white border border-gray-200 rounded-xl">
        <h3 className="text-base font-semibold text-gray-900 mb-4">
          백업 및 복원
        </h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-100 rounded-lg">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-blue-900">
                데이터 복원 시 기존 데이터와 중복될 수 있습니다. 필요한 경우
                먼저 현재 데이터를 백업해주세요.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleBackup}
              disabled={isProcessing}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              데이터 백업
            </button>

            <label className="flex-1">
              <input
                type="file"
                accept=".json"
                onChange={handleRestore}
                disabled={isProcessing}
                className="hidden"
              />
              <div className="flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                <Upload className="w-4 h-4" />
                데이터 복원
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* 동기화 상태 */}
      <div className="mb-6 p-5 bg-white border border-gray-200 rounded-xl">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-gray-900 mb-1">
              동기화 상태
            </h3>
            <p className="text-sm text-gray-600">
              {backupStats.pendingSync === 0
                ? "로컬 데이터가 클라우드와 동기화되었습니다."
                : "인터넷 연결 시 자동으로 동기화됩니다."}
            </p>
          </div>
        </div>
      </div>

      {/* 위험 구역 */}
      <div className="p-6 bg-white border border-red-200 rounded-xl">
        <div className="flex items-start gap-3 mb-5">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">
              위험 구역
            </h3>
            <p className="text-sm text-gray-600">
              아래 작업은 되돌릴 수 없습니다. 신중하게 진행하세요.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-gray-900 mb-1">
                워크스페이스 데이터 삭제
              </h4>
              <p className="text-xs text-gray-500">
                현재 워크스페이스의 모든 상품과 기록을 삭제합니다
              </p>
            </div>
            <button
              onClick={() => setShowConfirmModal("clear")}
              disabled={isProcessing || !currentWorkspaceId}
              className="ml-4 px-4 py-2 border border-red-300 text-red-600 text-sm font-medium rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              삭제
            </button>
          </div>

          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-gray-900 mb-1">
                전체 초기화
              </h4>
              <p className="text-xs text-gray-500">
                모든 워크스페이스, 설정, 데이터를 완전히 삭제합니다
              </p>
            </div>
            <button
              onClick={() => setShowConfirmModal("reset")}
              disabled={isProcessing}
              className="ml-4 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              초기화
            </button>
          </div>
        </div>
      </div>

      {/* 확인 모달 */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-start gap-4 mb-5">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  정말 {showConfirmModal === "reset" ? "초기화" : "삭제"}
                  하시겠습니까?
                </h3>
                <p className="text-sm text-gray-600">
                  {showConfirmModal === "reset"
                    ? "모든 워크스페이스와 데이터가 완전히 삭제됩니다. 이 작업은 되돌릴 수 없습니다."
                    : "현재 워크스페이스의 모든 상품과 기록이 삭제됩니다. 이 작업은 되돌릴 수 없습니다."}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() =>
                  showConfirmModal === "reset"
                    ? handleReset()
                    : handleClearData()
                }
                disabled={isProcessing}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    처리 중...
                  </span>
                ) : showConfirmModal === "reset" ? (
                  "초기화"
                ) : (
                  "삭제"
                )}
              </button>
              <button
                onClick={() => setShowConfirmModal(null)}
                disabled={isProcessing}
                className="flex-1 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

DataTab.displayName = "DataTab";
