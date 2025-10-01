// src/components/settings/DataTab.tsx
import React, { useCallback, useState, useMemo } from "react";
import {
  Database,
  Download,
  Upload,
  CloudOff,
  AlertTriangle,
  RotateCcw,
  HardDrive,
  Cloud,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import { useVisibleItems } from "../../stores/selectors";
import { useItemsStore } from "../../stores/itemsStore";
import { useMovementsStore } from "../../stores/movementsStore";
import { useOutboxStore } from "../../stores/outboxStore";

type ConfirmModalType = "clear" | "reset" | null;

// 선택자는 컴포넌트 바깥에 두어 참조를 안정화
const selectMovements = (state: any) => state.movements;
const selectOutboxItems = (state: any) => state.items;

export const DataTab: React.FC = React.memo(() => {
  const items = useVisibleItems(); // 내부에서 메모이즈됨
  const movements = useMovementsStore(useShallow(selectMovements));
  const outbox = useOutboxStore(useShallow(selectOutboxItems));

  const [showConfirmModal, setShowConfirmModal] =
    useState<ConfirmModalType>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // store 객체 자체를 의존성에 넣지 말고, 파생 데이터만 계산
  const backupStats = useMemo(() => {
    const safeItems = items ?? [];
    const safeMovements = movements ?? [];
    const safeOutbox = outbox ?? [];

    const totalItems = safeItems.length;
    const totalMovements = safeMovements.length;
    const pendingSync = safeOutbox.length;

    const dataSize = new Blob(
      [JSON.stringify({ items: safeItems, movements: safeMovements })],
      { type: "application/json" }
    ).size;
    const dataSizeKB = (dataSize / 1024).toFixed(2);

    return {
      totalItems,
      totalMovements,
      pendingSync,
      dataSize: `${dataSizeKB} KB`,
    };
  }, [items, movements, outbox]);

  const handleBackup = useCallback(() => {
    try {
      const data = {
        items,
        movements,
        exportDate: new Date().toISOString(),
        version: "1.0",
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `inventory-backup-${
        new Date().toISOString().split("T")[0]
      }.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("데이터 백업 실패:", error);
      alert("데이터 백업 중 오류가 발생했습니다.");
    }
  }, [items, movements]);

  const handleRestore = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        if (
          data.items &&
          Array.isArray(data.items) &&
          data.movements &&
          Array.isArray(data.movements)
        ) {
          // 실제 store 주입 로직은 기존 설계를 유지
          alert("복원 데이터 확인 완료. 로직 검증 후 상태에 반영하세요.");
        } else {
          alert("백업 파일 형식이 올바르지 않습니다.");
        }
      } catch (error) {
        console.error("데이터 복원 실패:", error);
        alert("데이터 복원 중 오류가 발생했습니다.");
      }
    };
    input.click();
  }, []);

  const handleClear = useCallback(async () => {
    setIsProcessing(true);
    try {
      const itemsStore = useItemsStore.getState();
      const movementsStore = useMovementsStore.getState();
      if (itemsStore.clearItems) await itemsStore.clearItems();
      if (movementsStore.clearMovements) await movementsStore.clearMovements();
      setShowConfirmModal(null);
      alert("현재 워크스페이스 데이터가 삭제되었습니다.");
    } catch (error) {
      console.error("데이터 삭제 실패:", error);
      alert("데이터 삭제 중 오류가 발생했습니다.");
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const handleReset = useCallback(async () => {
    setIsProcessing(true);
    try {
      localStorage.clear();
      sessionStorage.clear();
      window.location.reload();
    } catch (error) {
      console.error("앱 초기화 실패:", error);
      alert("앱 초기화 중 오류가 발생했습니다.");
    } finally {
      setIsProcessing(false);
    }
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white px-5 py-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Database className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">총 상품</p>
              <p className="text-2xl font-semibold text-gray-900">
                {backupStats.totalItems}
              </p>
            </div>
          </div>
        </div>
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white px-5 py-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <RotateCcw className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">총 기록</p>
              <p className="text-2xl font-semibold text-gray-900">
                {backupStats.totalMovements}
              </p>
            </div>
          </div>
        </div>
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white px-5 py-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Cloud className="h-8 w-8" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">동기화 대기</p>
              <p
                className={`text-2xl font-semibold ${
                  backupStats.pendingSync > 0
                    ? "text-orange-600"
                    : "text-green-600"
                }`}
              >
                {backupStats.pendingSync}
              </p>
            </div>
          </div>
        </div>
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white px-5 py-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <HardDrive className="h-8 w-8 text-gray-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">데이터 크기</p>
              <p className="text-2xl font-semibold text-gray-900">
                {backupStats.dataSize}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-6 py-4">
          <h3 className="text-base font-semibold text-gray-900">
            백업 및 복원
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            데이터를 안전하게 백업하고 복원하세요
          </p>
        </div>
        <div className="px-6 py-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <button
              onClick={handleBackup}
              className="flex items-center justify-center rounded-lg border-2 border-blue-600 bg-blue-50 px-4 py-6 transition-all hover:bg-blue-100"
            >
              <div className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-600">
                  <Download className="h-6 w-6 text-white" />
                </div>
                <h4 className="mt-3 text-sm font-semibold text-gray-900">
                  백업 생성
                </h4>
                <p className="mt-1 text-xs text-gray-500">
                  로컬에 JSON 파일로 내보냅니다
                </p>
              </div>
            </button>

            <button
              onClick={handleRestore}
              className="flex items-center justify-center rounded-lg border-2 border-gray-300 bg-white px-4 py-6 transition-all hover:border-gray-400 hover:bg-gray-50"
            >
              <div className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-600">
                  <Upload className="h-6 w-6 text-white" />
                </div>
                <h4 className="mt-3 text-sm font-semibold text-gray-900">
                  백업 복원
                </h4>
                <p className="mt-1 text-xs text-gray-500">
                  JSON 백업 파일을 선택하세요
                </p>
              </div>
            </button>
          </div>

          <div className="mt-4 rounded-lg bg-amber-50 p-4">
            <div className="flex">
              <AlertTriangle className="h-5 w-5 flex-shrink-0 text-amber-600" />
              <div className="ml-3">
                <p className="text-sm text-amber-800">
                  데이터 복원 시 기존 데이터와 중복될 수 있습니다. 필요한 경우
                  먼저 현재 데이터를 백업해주세요.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <div className="px-6 py-5">
          <div className="flex items-start">
            <div
              className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${
                backupStats.pendingSync > 0 ? "bg-orange-100" : "bg-green-100"
              }`}
            >
              {backupStats.pendingSync > 0 ? (
                <CloudOff className="h-5 w-5 text-orange-600" />
              ) : (
                <CheckCircle className="h-5 w-5 text-green-600" />
              )}
            </div>
            <div className="ml-4 flex-1">
              <h3 className="text-base font-semibold text-gray-900">
                {backupStats.pendingSync === 0
                  ? "모든 데이터 동기화됨"
                  : `${backupStats.pendingSync}개 항목 동기화 대기 중`}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {backupStats.pendingSync === 0
                  ? "로컬 데이터가 클라우드와 동기화되었습니다."
                  : "인터넷 연결 시 자동으로 동기화됩니다."}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border-2 border-red-200 bg-red-50">
        <div className="border-b border-red-200 px-6 py-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <h3 className="ml-2 text-base font-semibold text-red-900">
              위험 영역
            </h3>
          </div>
          <p className="mt-1 text-sm text-red-700">
            아래 작업은 되돌릴 수 없습니다. 신중하게 진행하세요.
          </p>
        </div>

        <div className="divide-y divide-red-200 px-6 py-4">
          <div className="py-4 first:pt-0 last:pb-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-gray-900">
                  현재 워크스페이스 데이터 삭제
                </h4>
                <p className="mt-1 text-sm text-gray-600">
                  현재 워크스페이스의 모든 상품과 기록을 삭제합니다
                </p>
              </div>
              <div>
                <button
                  onClick={() => setShowConfirmModal("clear")}
                  className="ml-4 flex-shrink-0 rounded-md border border-red-300 bg-white px-3 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-50"
                >
                  데이터 삭제
                </button>
              </div>
            </div>
          </div>

          <div className="py-4 first:pt-0 last:pb-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-gray-900">
                  앱 완전 초기화
                </h4>
                <p className="mt-1 text-sm text-gray-600">
                  모든 워크스페이스, 설정, 데이터를 완전히 삭제합니다
                </p>
              </div>
              <div>
                <button
                  onClick={() => setShowConfirmModal("reset")}
                  className="ml-4 flex-shrink-0 rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
                >
                  완전 초기화
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showConfirmModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setShowConfirmModal(null)}
        >
          <div
            className="mx-4 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center space-x-3">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">
                  {showConfirmModal === "reset"
                    ? "앱 완전 초기화"
                    : "현재 워크스페이스 데이터 삭제"}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {showConfirmModal === "reset"
                    ? "모든 워크스페이스와 데이터가 완전히 삭제됩니다. 이 작업은 되돌릴 수 없습니다."
                    : "현재 워크스페이스의 모든 상품과 기록이 삭제됩니다. 이 작업은 되돌릴 수 없습니다."}
                </p>
              </div>
            </div>

            <div className="mt-6 flex space-x-3">
              <button
                onClick={() => setShowConfirmModal(null)}
                disabled={isProcessing}
                className="flex-1 rounded-lg border-2 border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
              >
                취소
              </button>
              <button
                onClick={
                  showConfirmModal === "reset" ? handleReset : handleClear
                }
                disabled={isProcessing}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
              >
                {isProcessing ? "진행 중..." : "확인"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

DataTab.displayName = "DataTab";
