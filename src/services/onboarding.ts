// src/services/onboarding.ts
export type OnboardingStepKey = "addItem" | "recordMovement" | "enableAlerts";

export type StepStatus = "completed" | "active" | "locked";

export interface OnboardingState {
  steps: Record<OnboardingStepKey, StepStatus>;
  activeKey: OnboardingStepKey;
  allDone: boolean;
}

export function buildOnboardingState(opts: {
  totalItems: number;
  hasMovement: boolean;
  alertsEnabled: boolean;
}): OnboardingState {
  const step1: StepStatus = opts.totalItems > 0 ? "completed" : "active";
  const step2: StepStatus =
    step1 === "completed"
      ? opts.hasMovement
        ? "completed"
        : "active"
      : "locked";
  const step3: StepStatus =
    step2 === "completed"
      ? opts.alertsEnabled
        ? "completed"
        : "active"
      : "locked";

  const activeKey: OnboardingStepKey =
    step1 !== "completed"
      ? "addItem"
      : step2 !== "completed"
      ? "recordMovement"
      : "enableAlerts";

  const steps: Record<OnboardingStepKey, StepStatus> = {
    addItem: step1,
    recordMovement: step2,
    enableAlerts: step3,
  };

  const allDone =
    step1 === "completed" && step2 === "completed" && step3 === "completed";
  return { steps, activeKey, allDone };
}
