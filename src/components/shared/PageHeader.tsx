// src/components/shared/PageHeader.tsx

import { memo } from "react";

interface HeaderAction {
  onNewItem?: () => void;
}

interface PageHeaderProps {
  title: string;
  description: string;
  actions?: HeaderAction;
}

export const PageHeader = memo<PageHeaderProps>(
  ({ title, description, actions }) => {
    return (
      <div className="py-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-y-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            <p className="text-gray-600 mt-1">{description}</p>
          </div>
          {actions?.onNewItem && (
            <button
              onClick={actions.onNewItem}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              신규 등록
            </button>
          )}
        </div>
      </div>
    );
  }
);

PageHeader.displayName = "PageHeader";
