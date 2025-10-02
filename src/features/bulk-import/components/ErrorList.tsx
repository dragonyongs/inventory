import React from "react";
import { XCircle, AlertTriangle } from "lucide-react";

type ErrorListProps = {
  errors?: string[];
  warnings?: string[];
};

export const ErrorList: React.FC<ErrorListProps> = ({ errors, warnings }) => {
  if (
    (!errors || errors.length === 0) &&
    (!warnings || warnings.length === 0)
  ) {
    return null;
  }

  return (
    <div className="space-y-2">
      {/* Errors */}
      {errors && errors.length > 0 && (
        <div className="space-y-1">
          {errors.map((error, index) => (
            <div
              key={`error-${index}`}
              className="flex items-start gap-2 text-xs text-red-700"
            >
              <XCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          ))}
        </div>
      )}

      {/* Warnings */}
      {warnings && warnings.length > 0 && (
        <div className="space-y-1">
          {warnings.map((warning, index) => (
            <div
              key={`warning-${index}`}
              className="flex items-start gap-2 text-xs text-yellow-700"
            >
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>{warning}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
