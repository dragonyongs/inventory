// src/components/dashboard/EmptyState.tsx
import React from "react";
import { Link } from "react-router-dom";
import { Building2, Plus } from "lucide-react";

interface EmptyStateProps {
  hasWorkspace: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = React.memo(
  ({ hasWorkspace }) => {
    if (!hasWorkspace) {
      return (
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-4">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Building2 className="w-12 h-12 text-gray-400" />
            </div>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              워크스페이스가 필요합니다
            </h2>

            <p className="text-gray-600 mb-8 leading-relaxed">
              재고 관리를 시작하려면 먼저 워크스페이스를 생성하세요.
            </p>

            <Link
              to="/workspace/new"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5 mr-2" />
              워크스페이스 생성
            </Link>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center max-w-lg mx-auto px-4">
          <div className="w-32 h-32 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <Building2 className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            재고 현황을 한눈에 확인하세요
          </h2>

          <p className="text-xl text-gray-600 mb-12 leading-relaxed">
            등록된 상품, 재고 부족 알림, 최근 활동을
            <br />
            대시보드에서 실시간으로 모니터링할 수 있습니다.
          </p>

          {/* 통계 카드들 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            <div className="bg-white rounded-xl border border-gray-200 p-6 text-center shadow-sm">
              <div className="text-3xl font-bold text-blue-600 mb-2">0</div>
              <div className="text-sm font-medium text-gray-500">전체 상품</div>
              <div className="text-xs text-gray-400 mt-1">
                상품을 추가해주세요
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6 text-center shadow-sm">
              <div className="text-3xl font-bold text-green-600 mb-2">0</div>
              <div className="text-sm font-medium text-gray-500">재고 부족</div>
              <div className="text-xs text-gray-400 mt-1">
                모든 재고가 안전합니다
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6 text-center shadow-sm">
              <div className="text-3xl font-bold text-purple-600 mb-2">0</div>
              <div className="text-sm font-medium text-gray-500">
                최근 움직임
              </div>
              <div className="text-xs text-gray-400 mt-1">
                활동 내역이 없습니다
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6 text-center shadow-sm">
              <div className="text-3xl font-bold text-orange-600 mb-2">0</div>
              <div className="text-sm font-medium text-gray-500">총 재고</div>
              <div className="text-xs text-gray-400 mt-1">
                재고를 관리해보세요
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/inventory/new"
              className="inline-flex items-center px-8 py-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all hover:scale-105 shadow-lg"
            >
              <Plus className="w-5 h-5 mr-2" />첫 상품 등록하기
            </Link>

            <Link
              to="/inventory"
              className="inline-flex items-center px-8 py-4 bg-white text-blue-600 font-semibold rounded-xl border-2 border-blue-600 hover:bg-blue-50 transition-all hover:scale-105"
            >
              상품 목록 보기
            </Link>
          </div>

          <p className="text-sm text-gray-500 mt-8">
            상품을 등록하면 여기에 재고 현황이 표시됩니다
          </p>
        </div>
      </div>
    );
  }
);

EmptyState.displayName = "EmptyState";
