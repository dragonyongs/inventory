import React from "react";
import {
  CheckCircle,
  Package2,
  ArrowUpRight,
  BarChart3,
  ChevronRight,
} from "lucide-react";

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
  return (
    <div
      className={`flex items-center justify-between p-4 rounded-lg border transition-all cursor-pointer group ${
        status === "active"
          ? "bg-white border-gray-300 hover:border-gray-400 hover:shadow-sm"
          : status === "completed"
          ? "bg-green-50 border-green-200"
          : "bg-gray-50 border-gray-200 opacity-60 cursor-not-allowed"
      }`}
      onClick={status !== "locked" ? onClick : undefined}
    >
      <div className="flex items-center space-x-4">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
            status === "completed"
              ? "bg-green-100 text-green-600"
              : status === "active"
              ? "bg-gray-100 text-gray-600 group-hover:bg-blue-100 group-hover:text-blue-600"
              : "bg-gray-100 text-gray-400"
          }`}
        >
          {status === "completed" ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <Icon className="w-5 h-5" />
          )}
        </div>

        <div className="flex-1">
          <div
            className={`text-sm font-medium ${
              status === "completed" ? "text-green-800" : "text-gray-900"
            }`}
          >
            단계 {index}. {title}
          </div>
          <div
            className={`text-xs mt-1 ${
              status === "completed" ? "text-green-600" : "text-gray-500"
            }`}
          >
            {desc}
          </div>
        </div>
      </div>

      <div className="flex items-center">
        {status === "active" ? (
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-500">시작하기</span>
            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
          </div>
        ) : status === "completed" ? (
          <div className="flex items-center text-green-600">
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
        <div className="bg-white border border-green-200 rounded-lg p-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                설정이 완료되었습니다!
              </h3>
              <p className="text-sm text-gray-600">
                이제 효율적인 재고 관리를 시작하세요.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            재고 관리 시작하기
          </h3>
          <p className="text-sm text-gray-600">
            아래 단계를 따라 재고 관리 시스템을 설정해보세요.
          </p>
        </div>

        <div className="space-y-3">
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
