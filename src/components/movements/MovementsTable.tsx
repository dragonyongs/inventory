// src/components/movements/MovementsTable.tsx

import { memo, useCallback } from "react";
import {
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  Clock,
  Trash2,
  User,
} from "lucide-react";
import type { Movement } from "@/stores/movementsStore";
import { useItemsStore } from "@/stores/itemsStore";
import { useAuthStore } from "@/stores/authStore";
import type { ActionLabels } from "@/utils/workspaceLabels";

interface MovementsTableProps {
  movements: Movement[];
  onDelete: (id: string) => void;
  actionLabels: ActionLabels; // ✅ 정확한 타입 지정
}

export const MovementsTable = memo<MovementsTableProps>(
  ({ movements, onDelete, actionLabels }) => {
    const items = useItemsStore((s) => s.items);
    const currentUser = useAuthStore((s) => s.user);

    // 아이템 이름 가져오기 (삭제된 경우 스냅샷 활용)
    const getItemName = useCallback(
      (movement: Movement) => {
        const item = items[movement.itemId];
        if (item) return item.name;
        if (movement.itemSnapshot) return movement.itemSnapshot.name;
        return "알 수 없음";
      },
      [items]
    );

    // ✅ 사용자 이름 표시 함수
    const getUserDisplay = useCallback(
      (movement: Movement) => {
        // 1. userName이 있으면 우선 사용
        if (movement.userName) {
          return movement.userName;
        }

        // 2. userId가 현재 사용자와 같으면 "나"
        if (movement.userId && currentUser?.id === movement.userId) {
          return "나";
        }

        // 3. 공유 액세스인 경우
        if (movement.isSharedAccess) {
          return "공유 사용자";
        }

        // 4. 로그인한 사용자 이메일 표시
        if (movement.userEmail) {
          return movement.userEmail.split("@")[0]; // 이메일 앞부분만
        }

        // 5. 기본값
        return "익명";
      },
      [currentUser]
    );

    // 움직임 아이콘 가져오기
    const getMovementIcon = useCallback((type: string) => {
      switch (type) {
        case "IN":
          return <ArrowDownLeft className="w-4 h-4 flex-shrink-0" />;
        case "OUT":
          return <ArrowUpRight className="w-4 h-4 flex-shrink-0" />;
        case "USE":
          return <ArrowUpRight className="w-4 h-4 flex-shrink-0" />;
        case "ADJUST":
          return <RefreshCw className="w-4 h-4 flex-shrink-0" />;
        default:
          return <Clock className="w-4 h-4 flex-shrink-0" />;
      }
    }, []);

    // 움직임 타입 스타일
    const getMovementStyle = useCallback((type: string) => {
      switch (type) {
        case "IN":
          return "bg-green-100 text-green-700 border-green-200";
        case "OUT":
          return "bg-red-100 text-red-700 border-red-200";
        case "USE":
          return "bg-red-100 text-red-700 border-red-200";
        case "ADJUST":
          return "bg-blue-100 text-blue-700 border-blue-200";
        case "TRANSFER":
          return "bg-purple-100 text-purple-700 border-purple-200";
        case "DELETE":
          return "bg-gray-100 text-gray-700 border-gray-200";
        default:
          return "bg-gray-100 text-gray-700 border-gray-200";
      }
    }, []);

    // 타입 라벨
    const getTypeLabel = useCallback(
      (type: string) => {
        switch (type) {
          case "IN":
            return actionLabels.IN;
          case "OUT":
            return actionLabels.OUT;
          case "USE":
            return actionLabels.USE;
          case "ADJUST":
            return actionLabels.ADJUST;
          case "TRANSFER":
            return actionLabels.TRANSFER;
          case "DELETE":
            return "삭제";
          default:
            return type;
        }
      },
      [actionLabels]
    );

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  유형
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  상품명
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  수량
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  메모
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  사용자
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  일시
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-20 min-w-[80px]">
                  작업
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {movements.map((movement) => (
                <tr
                  key={movement.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div
                      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-sm font-medium ${getMovementStyle(
                        movement.type
                      )}`}
                    >
                      {getMovementIcon(movement.type)}
                      <span>{getTypeLabel(movement.type)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {getItemName(movement)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {movement.type === "OUT" || movement.type === "USE"
                        ? "-"
                        : "+"}
                      {Math.abs(movement.qty)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-600 max-w-xs truncate">
                      {movement.reason || "-"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-gray-500" />
                        </div>
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {getUserDisplay(movement)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600">
                      {new Date(movement.createdAt).toLocaleString("ko-KR", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center w-20 min-w-[80px]">
                    <button
                      onClick={() => onDelete(movement.id)}
                      className="inline-flex items-center justify-center text-red-600 hover:text-red-800 
                             transition-colors p-2 rounded-lg hover:bg-red-50 flex-shrink-0"
                      title="삭제"
                    >
                      <Trash2 className="w-4 h-4 flex-shrink-0" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
);

MovementsTable.displayName = "MovementsTable";
