import React from "react";
import { CheckCircle2, Upload, FileCheck, Database } from "lucide-react";
import type { ImportProgress } from "../types";

type Step = {
  id: number;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

const STEPS: Step[] = [
  { id: 1, label: "파일 업로드", icon: Upload },
  { id: 2, label: "데이터 검증", icon: FileCheck },
  { id: 3, label: "일괄 등록", icon: Database },
];

type ProgressStepsProps = {
  currentStep: number;
  progress?: ImportProgress;
};

export const ProgressSteps: React.FC<ProgressStepsProps> = ({
  currentStep,
  progress,
}) => {
  return (
    <div className="w-full py-8">
      <div className="flex items-center justify-between max-w-2xl mx-auto">
        {STEPS.map((step, index) => {
          const isCompleted = currentStep > step.id;
          const isCurrent = currentStep === step.id;
          const isProcessing = isCurrent && progress?.status === "processing";
          const Icon = step.icon;

          return (
            <React.Fragment key={step.id}>
              {/* Step indicator */}
              <div className="flex flex-col items-center gap-2">
                <div
                  className={`
                    w-12 h-12 rounded-full flex items-center justify-center
                    transition-all duration-200
                    ${
                      isCompleted
                        ? "bg-green-500 text-white"
                        : isCurrent
                        ? "bg-gray-900 text-white"
                        : "bg-gray-100 text-gray-400"
                    }
                    ${isProcessing ? "animate-pulse" : ""}
                  `}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-6 h-6" />
                  ) : (
                    <Icon className="w-6 h-6" />
                  )}
                </div>
                <span
                  className={`
                    text-sm font-medium
                    ${
                      isCompleted || isCurrent
                        ? "text-gray-900"
                        : "text-gray-400"
                    }
                  `}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector line */}
              {index < STEPS.length - 1 && (
                <div
                  className={`
                    flex-1 h-0.5 mx-4
                    transition-colors duration-200
                    ${currentStep > step.id ? "bg-green-500" : "bg-gray-200"}
                  `}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Progress bar for importing */}
      {progress && progress.status === "processing" && (
        <div className="max-w-2xl mx-auto mt-6">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>
              {progress.current} / {progress.total} 처리 중
            </span>
            <span>{progress.percentage}%</span>
          </div>
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gray-900 transition-all duration-300"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
