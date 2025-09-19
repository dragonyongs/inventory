// src/pages/Movements.tsx
import { useMemo } from "react";
import {
  Activity,
  Calendar,
  ArrowUpRight,
  ArrowDownLeft,
  RotateCcw,
} from "lucide-react";
import { useMovementList, useItemList } from "../stores/selectors";
import type { Movement } from "../stores/movementsStore"; // Movement 타입 import

type UIMovement = Movement & {
  itemName: string;
};

export default function Movements() {
  const movements = useMovementList() || []; // 기본값 설정
  const items = useItemList() || []; // 기본값 설정

  const enrichedMovements = useMemo(() => {
    return movements.map((m: Movement) => ({
      // 타입 명시
      ...m,
      itemName:
        items.find((item: any) => item.id === m.itemId)?.name || "Unknown Item",
    })) as UIMovement[];
  }, [movements, items]);

  const recentMovements = useMemo(() => {
    return enrichedMovements
      .filter(
        (m: UIMovement) =>
          Date.now() - new Date(m.createdAt).getTime() <
          30 * 24 * 60 * 60 * 1000
      )
      .sort(
        (a: UIMovement, b: UIMovement) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ); // 타입 명시
  }, [enrichedMovements]);

  const getMovementIcon = (type: string) => {
    switch (type) {
      case "IN":
        return <ArrowUpRight className="w-4 h-4" />;
      case "OUT":
        return <ArrowDownLeft className="w-4 h-4" />;
      case "ADJUST":
        return <RotateCcw className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const getMovementColor = (type: string) => {
    switch (type) {
      case "IN":
        return "text-green-600 bg-green-50";
      case "OUT":
        return "text-red-600 bg-red-50";
      case "ADJUST":
        return "text-blue-600 bg-blue-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const getMovementLabel = (type: string) => {
    switch (type) {
      case "IN":
        return "입고";
      case "OUT":
        return "출고";
      case "ADJUST":
        return "조정";
      default:
        return type;
    }
  };

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">이동내역</h1>
        <p className="text-gray-600">재고 입출고 내역을 확인하세요</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Activity className="w-5 h-5 mr-2 text-blue-600" />
            최근 이동내역
          </h3>
        </div>

        <div className="p-6">
          {recentMovements.length > 0 ? (
            <div className="space-y-4">
              {recentMovements.map((movement, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div
                      className={`p-2 rounded-lg ${getMovementColor(
                        movement.type
                      )}`}
                    >
                      {getMovementIcon(movement.type)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {movement.itemName}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            movement.type === "IN"
                              ? "bg-green-100 text-green-800"
                              : movement.type === "OUT"
                              ? "bg-red-100 text-red-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {getMovementLabel(movement.type)}
                        </span>
                        {movement.reason && (
                          <span className="text-xs text-gray-500">
                            • {movement.reason}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className={`text-lg font-semibold ${
                        movement.type === "IN"
                          ? "text-green-600"
                          : movement.type === "OUT"
                          ? "text-red-600"
                          : "text-blue-600"
                      }`}
                    >
                      {movement.type === "IN"
                        ? "+"
                        : movement.type === "OUT"
                        ? "-"
                        : "±"}
                      {movement.qty}
                    </div>
                    <div className="flex items-center text-xs text-gray-400 mt-1">
                      <Calendar className="w-3 h-3 mr-1" />
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
              <p className="text-gray-500">최근 이동내역이 없습니다.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
