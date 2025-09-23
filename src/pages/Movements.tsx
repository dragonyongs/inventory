// src/pages/Movements.tsx
import React, { useMemo } from "react";
import {
  ArrowUpRight,
  ArrowDownLeft,
  Activity,
  Clock,
  Search,
  Trash2,
} from "lucide-react";
import { useMovementList } from "../stores/selectors";
import { useWorkspaceStore } from "../stores/workspaceStore";
import { getActionLabels } from "../utils/workspaceLabels";

export default function Movements() {
  const movements = useMovementList();
  const { getCurrentWorkspace } = useWorkspaceStore();
  const currentWorkspace = getCurrentWorkspace();

  // 최근 움직임 (최대 50개)
  const recentMovements = useMemo(() => {
    return movements.slice(0, 50);
  }, [movements]);

  // 움직임 아이콘 가져오기
  const getMovementIcon = (type: string) => {
    switch (type) {
      case "IN":
        return <ArrowUpRight className="w-4 h-4" />;
      case "OUT":
      case "USE":
        return <ArrowDownLeft className="w-4 h-4" />;
      case "DELETE":
        return <Trash2 className="w-4 h-4" />;
      case "ADJUST":
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  // 움직임 색상 가져오기
  const getMovementColor = (type: string) => {
    switch (type) {
      case "IN":
        return "text-green-600 bg-green-50";
      case "OUT":
      case "USE":
        return "text-red-600 bg-red-50";
      case "DELETE":
        return "text-gray-600 bg-gray-50";
      case "ADJUST":
      default:
        return "text-blue-600 bg-blue-50";
    }
  };

  // 움직임 라벨 가져오기
  const getMovementLabel = (type: string) => {
    if (type === "DELETE") return "삭제";

    if (!currentWorkspace) {
      // 기본값
      switch (type) {
        case "IN":
          return "입고";
        case "OUT":
          return "출고";
        case "USE":
          return "사용";
        case "ADJUST":
          return "조정";
        case "TRANSFER":
          return "이동";
        default:
          return type;
      }
    }

    const labels = getActionLabels(currentWorkspace.type || "DEFAULT");
    return labels[type as keyof typeof labels] || type;
  };

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">이동내역</h1>
        <p className="text-gray-600">재고 입출고 내역을 확인하세요</p>
      </div>

      {/* 검색 */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="상품명, SKU, 바코드로 검색..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* 최근 이동내역 */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Activity className="w-5 h-5 mr-2 text-blue-600" />
              최근 이동내역
            </h3>
            <span className="text-sm text-gray-500">
              총 {movements.length}개 활동
            </span>
          </div>
        </div>

        <div className="p-6">
          {recentMovements.length > 0 ? (
            <div className="gap-y-4">
              {recentMovements.map((movement) => (
                <div
                  key={movement.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-x-4">
                    {/* 아이콘 */}
                    <div
                      className={`p-2 rounded-lg ${getMovementColor(
                        movement.type
                      )}`}
                    >
                      {getMovementIcon(movement.type)}
                    </div>

                    <div>
                      {/* ✅ 개선: 삭제된 아이템 표시 */}
                      <div className="flex items-center gap-x-2">
                        <span
                          className={`font-medium ${
                            movement.isItemDeleted
                              ? "text-gray-500 line-through"
                              : "text-gray-900"
                          }`}
                        >
                          {movement.itemName}
                        </span>

                        {/* ✅ 삭제된 아이템 표시 */}
                        {movement.isItemDeleted && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                            삭제됨
                          </span>
                        )}

                        {/* SKU 표시 */}
                        {movement.itemSku && (
                          <span className="text-xs text-gray-500">
                            SKU: {movement.itemSku}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-x-2 mt-1">
                        {/* 움직임 타입 */}
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            movement.type === "DELETE"
                              ? "bg-gray-100 text-gray-800"
                              : movement.type === "IN"
                              ? "bg-green-100 text-green-800"
                              : movement.type === "OUT" ||
                                movement.type === "USE"
                              ? "bg-red-100 text-red-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {getMovementLabel(movement.type)}
                        </span>

                        {/* 사유 */}
                        {movement.reason && (
                          <span className="text-xs text-gray-500">
                            • {movement.reason}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 수량 및 시간 */}
                  <div className="text-right">
                    {movement.type !== "DELETE" && (
                      <div
                        className={`text-lg font-semibold ${
                          movement.type === "IN"
                            ? "text-green-600"
                            : movement.type === "OUT" || movement.type === "USE"
                            ? "text-red-600"
                            : "text-blue-600"
                        }`}
                      >
                        {movement.type === "IN"
                          ? "+"
                          : movement.type === "OUT" || movement.type === "USE"
                          ? "-"
                          : "±"}
                        {movement.qty}
                      </div>
                    )}

                    {movement.type === "DELETE" && (
                      <div className="text-sm text-gray-500 font-medium">
                        상품 삭제
                      </div>
                    )}

                    <div className="flex items-center text-xs text-gray-400 mt-1">
                      <Clock className="w-3 h-3 mr-1" />
                      {new Date(movement.createdAt).toLocaleDateString(
                        "ko-KR",
                        {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Activity className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">아직 이동 내역이 없습니다.</p>
              <p className="text-sm text-gray-400 mt-1">
                상품을 추가하고 입출고를 기록해보세요.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
