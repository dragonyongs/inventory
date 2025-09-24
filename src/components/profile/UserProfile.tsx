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
        className="flex space-x-2 items-center w-full px-4 py-3 text-left bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        onClick={() => setIsOpen((v) => !v)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        <UserAvatar user={user} />
        <div className="flex-1">
          <span className="text-sm font-medium">
            {user?.name || user?.email || "Guest"}
          </span>
          <RoleBadge role={role} />
        </div>
        <ChevronUp
          className={`w-4 h-4 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      <ProfileMenu isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <ul className="flex flex-col gap-1">
          <li>
            <button className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-100">
              <Shield className="w-4 h-4" />
              <span>Profile</span>
            </button>
          </li>
          <li>
            <button className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-100">
              <Mail className="w-4 h-4" />
              <span>{user?.email || "Not signed in"}</span>
            </button>
          </li>
          <li>
            <button className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-100">
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </button>
          </li>

          {can("manageUsers") && (
            <li>
              <button className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-100">
                <Users className="w-4 h-4" />
                <span>Manage members</span>
              </button>
            </li>
          )}

          <li className="border-t my-1" />

          <li>
            <button
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-red-50 text-red-600"
              onClick={() => {
                setIsOpen(false);
                logout();
              }}
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </li>

          {isOwner && (
            <li className="text-[10px] text-gray-500 px-2 pt-1">
              Owner access
            </li>
          )}
        </ul>
      </ProfileMenu>
    </div>
  );
};
