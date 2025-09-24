// src/pages/dashboard/OnboardingCard.tsx
import React from "react";
import type { OnboardingState, OnboardingStepKey } from "@/services/onboarding";

type Props = {
  state: OnboardingState;
  onAction: (step: OnboardingStepKey) => void;
};

const StepRow: React.FC<{
  index: number;
  title: string;
  desc: string;
  status: "completed" | "active" | "locked";
  onClick?: () => void;
}> = React.memo(({ index, title, desc, status, onClick }) => {
  const base = "flex items-center justify-between p-4 rounded-lg border";
  const style =
    status === "active"
      ? "bg-white border-blue-200 ring-2 ring-blue-100"
      : status === "completed"
      ? "bg-gray-50 border-gray-200 opacity-70"
      : "bg-gray-25 border-gray-100 opacity-60 pointer-events-none";
  return (
    <div className={`${base} ${style}`}>
      <div className="flex items-center gap-4">
        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm">
          {index}
        </div>
        <div>
          <div className="text-sm font-medium">{title}</div>
          <div className="text-xs text-gray-500">{desc}</div>
        </div>
      </div>
      {status === "active" ? (
        <button
          className="px-3 py-1.5 text-sm rounded bg-blue-600 text-white"
          onClick={onClick}
        >
          진행하기
        </button>
      ) : status === "completed" ? (
        <span className="text-xs text-gray-500">완료됨</span>
      ) : (
        <span className="text-xs text-gray-400">잠금</span>
      )}
    </div>
  );
});

export const OnboardingCard: React.FC<Props> = React.memo(
  ({ state, onAction }) => {
    return (
      <div className="bg-white rounded-xl border p-4">
        <div className="text-base font-semibold mb-3">시작하기</div>
        <div className="flex flex-col gap-3">
          <StepRow
            index={1}
            title="상품 추가"
            desc="첫 번째 상품을 등록해보세요"
            status={state.steps.addItem}
            onClick={() => onAction("addItem")}
          />
          <StepRow
            index={2}
            title="재고 관리"
            desc="입출고 내역을 기록하세요"
            status={state.steps.recordMovement}
            onClick={() => onAction("recordMovement")}
          />
          <StepRow
            index={3}
            title="분석 및 알림"
            desc="최소 재고를 설정해 부족 알림을 받아보세요"
            status={state.steps.enableAlerts}
            onClick={() => onAction("enableAlerts")}
          />
        </div>
      </div>
    );
  }
);
