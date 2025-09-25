// src/components/dashboard/OnboardingCard.tsx

import React from "react";
import { CheckCircle, Package2, ArrowUpRight, BarChart3 } from "lucide-react";

// onboarding.ts에서 import
export type { OnboardingStepKey } from "../../services/onboarding";
import type { OnboardingState } from "../../services/onboarding";

interface Props {
  state: OnboardingState;
  onAction: (step: string) => void; // OnboardingStepKey 대신 string 사용
}

const StepRow: React.FC<{
  index: number;
  title: string;
  desc: string;
  status: "completed" | "active" | "locked";
  icon: React.ComponentType<any>;
  onClick?: () => void;
}> = React.memo(({ index, title, desc, status, icon: Icon, onClick }) => {
  const base =
    "flex items-center justify-between p-4 rounded-lg border transition-all";
  const style =
    status === "active"
      ? "bg-white border-blue-200 ring-2 ring-blue-100 hover:ring-blue-200 cursor-pointer"
      : status === "completed"
      ? "bg-green-50 border-green-200"
      : "bg-gray-50 border-gray-200 opacity-60 pointer-events-none";

  return (
    <div className={`${base} ${style}`} onClick={onClick}>
      <div className="flex items-center gap-4">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center ${
            status === "completed"
              ? "bg-green-100 text-green-600"
              : status === "active"
              ? "bg-blue-100 text-blue-600"
              : "bg-gray-100 text-gray-400"
          }`}
        >
          {status === "completed" ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <Icon className="w-5 h-5" />
          )}
        </div>

        <div>
          <div
            className={`text-sm font-medium ${
              status === "completed" ? "text-green-800" : "text-gray-900"
            }`}
          >
            단계 {index} - {title}
          </div>
          <div
            className={`text-xs ${
              status === "completed" ? "text-green-600" : "text-gray-500"
            }`}
          >
            {desc}
          </div>
        </div>
      </div>

      <div>
        {status === "active" ? (
          <button className="px-3 py-1.5 text-sm rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors">
            시작하기
          </button>
        ) : status === "completed" ? (
          <div className="flex items-center text-green-600">
            <CheckCircle className="w-4 h-4 mr-1" />
            <span className="text-xs font-medium">완료</span>
          </div>
        ) : (
          <span className="text-xs text-gray-400">대기중</span>
        )}
      </div>
    </div>
  );
});

StepRow.displayName = "StepRow";

export const OnboardingCard: React.FC<Props> = React.memo(
  ({ state, onAction }) => {
    const allCompleted = state.allDone;

    if (allCompleted) {
      return (
        <div className="bg-gradient-to-br from-green-50 to-blue-50 border border-green-200 rounded-xl p-6">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                재고 관리 시스템이 준비되었습니다! 🎉
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                이제 효율적인 재고 관리를 시작하세요!
              </p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            새로운 워크스페이스에서 재고 관리를 시작해보세요!
          </h3>
          <p className="text-sm text-gray-600">
            이 워크스페이스에는 아직 등록된 상품이 없습니다. 첫 번째 상품을
            추가하여 재고 관리를 시작해보세요.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <StepRow
            index={1}
            title="상품 추가"
            desc="첫 번째 상품을 등록해보세요"
            icon={Package2}
            status={state.steps.addItem}
            onClick={() =>
              state.steps.addItem === "active" && onAction("addItem")
            }
          />

          <StepRow
            index={2}
            title="재고 기록"
            desc="입출고 내역을 작성해보세요"
            icon={ArrowUpRight}
            status={state.steps.recordMovement}
            onClick={() =>
              state.steps.recordMovement === "active" &&
              onAction("recordMovement")
            }
          />

          <StepRow
            index={3}
            title="알림 설정"
            desc="재고 부족 알림을 활성화하세요"
            icon={BarChart3}
            status={state.steps.enableAlerts}
            onClick={() =>
              state.steps.enableAlerts === "active" && onAction("enableAlerts")
            }
          />
        </div>
      </div>
    );
  }
);

OnboardingCard.displayName = "OnboardingCard";
