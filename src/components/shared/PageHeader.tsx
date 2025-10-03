// src/components/shared/PageHeader.tsx
import { memo, ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description: string;
  actions?: ReactNode;
}

export const PageHeader = memo<PageHeaderProps>(
  ({ title, description, actions }) => {
    return (
      <header className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-y-4 bg-white px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* 모바일: 세로 레이아웃, 데스크탑: 가로 레이아웃 */}
        <div className="flex flex-col">
          {/* 타이틀 영역 */}
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight break-words">
              {title}
            </h1>
          </div>

          {/* 설명 텍스트 */}
          <p className="mt-3 text-sm sm:text-base text-gray-600 leading-relaxed">
            {description}
          </p>
        </div>

        {/* 액션 버튼 영역 - 모바일에서 전체 너비 */}
        {actions && (
          <div className="flex-shrink-0 w-full sm:w-auto">{actions}</div>
        )}
      </header>
    );
  }
);

PageHeader.displayName = "PageHeader";
