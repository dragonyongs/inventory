// src/components/profile/ProfileMenu.tsx
import React from "react";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
};

export const ProfileMenu: React.FC<Props> = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;
  return (
    <div
      role="menu"
      className="absolute bottom-14 left-0 right-0 mt-2 w-full rounded border bg-white shadow-md z-50"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        className="absolute inset-0 opacity-0 cursor-default"
        aria-hidden
        onClick={onClose}
      />
      <div className="relative p-2">{children}</div>
    </div>
  );
};
