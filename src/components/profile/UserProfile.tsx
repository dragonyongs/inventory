// src/components/profile/UserProfile.tsx
import React, { useEffect, useRef, useState } from "react";
import { ChevronUp, LogOut, Mail, Settings, Shield, Users } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useMembership } from "@/hooks/useMembership";
import { UserAvatar } from "./UserAvatar";
import { RoleBadge } from "./RoleBadge";
import { ProfileMenu } from "./ProfileMenu";

export const UserProfile: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const logout = useAuthStore((s) => s.logout);
  const { user, role, can, isOwner } = useMembership();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        className="flex items-center gap-3 w-full px-3 py-2.5 text-left bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
        onClick={() => setIsOpen((v) => !v)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        <UserAvatar user={user} />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-gray-900 truncate">
            {user?.name || user?.email || "Guest"}
          </div>
          <div className="mt-1">
            <RoleBadge role={role} />
          </div>
        </div>
        <ChevronUp
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      <ProfileMenu isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <div className="py-1">
          <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-50 transition-colors">
            <Shield className="w-4 h-4 text-gray-400" />
            <span>프로필</span>
          </button>

          <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-50 transition-colors">
            <Mail className="w-4 h-4 text-gray-400" />
            <span className="truncate">{user?.email || "로그인되지 않음"}</span>
          </button>

          <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-50 transition-colors">
            <Settings className="w-4 h-4 text-gray-400" />
            <span>설정</span>
          </button>

          {can("manageUsers") && (
            <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-50 transition-colors">
              <Users className="w-4 h-4 text-gray-400" />
              <span>멤버 관리</span>
            </button>
          )}

          <div className="border-t border-gray-100 my-1" />

          <button
            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 rounded-md hover:bg-red-50 transition-colors"
            onClick={() => {
              setIsOpen(false);
              logout();
            }}
          >
            <LogOut className="w-4 h-4" />
            <span>로그아웃</span>
          </button>

          {isOwner && (
            <div className="px-3 py-1 text-xs text-gray-500 border-t border-gray-100 mt-1">
              소유자 권한
            </div>
          )}
        </div>
      </ProfileMenu>
    </div>
  );
};
