// src/components/icons/WonIcon.tsx

import React from "react";

interface WonIconProps {
  size?: number | string;
  color?: string;
  strokeWidth?: number;
  className?: string;
}

export const WonIcon: React.FC<WonIconProps> = ({
  size = 24,
  color = "currentColor",
  strokeWidth = 2,
  className = "",
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* 매우 심플한 ₩ 디자인 */}
      <path d="M 5 5 L 8.5 16" />
      <path d="M 12 5 L 12 16" />
      <path d="M 15.5 5 L 19 16" />
      <line x1="3" y1="9.5" x2="21" y2="9.5" />
      <line x1="3" y1="13" x2="21" y2="13" />
    </svg>
  );
};
