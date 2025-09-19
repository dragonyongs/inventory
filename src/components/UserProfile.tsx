// src/components/UserProfile.tsx
import { useState, useRef, useEffect } from "react";
import {
  User,
  Settings,
  LogOut,
  ChevronUp,
  Mail,
  Crown,
  Shield,
  Users,
} from "lucide-react";
import { useAuthStore } from "../stores/authStore";
import { useWorkspaceStore } from "../stores/workspaceStore";

export const UserProfile = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const currentId = useWorkspaceStore((s) => s.currentId);
  const getUserRole = useWorkspaceStore((s) => s.getUserRole);

  const currentRole =
    currentId && user ? getUserRole(currentId, user.id) : null;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getRoleIcon = (role: string | null) => {
    switch (role) {
      case "owner":
        return <Crown className="w-4 h-4 text-yellow-500" />;
      case "admin":
        return <Shield className="w-4 h-4 text-blue-500" />;
      case "member":
        return <Users className="w-4 h-4 text-green-500" />;
      case "viewer":
        return <User className="w-4 h-4 text-gray-500" />;
      default:
        return <User className="w-4 h-4 text-gray-500" />;
    }
  };

  const getRoleLabel = (role: string | null) => {
    switch (role) {
      case "owner":
        return "오너";
      case "admin":
        return "관리자";
      case "member":
        return "멤버";
      case "viewer":
        return "뷰어";
      default:
        return "게스트";
    }
  };

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors group"
      >
        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
          <span className="text-sm font-bold text-white">
            {user.name.charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="flex-1 min-w-0 text-left">
          <p className="text-sm font-medium text-gray-900 truncate">
            {user.name}
          </p>
          <div className="flex items-center space-x-1">
            {getRoleIcon(currentRole)}
            <span className="text-xs text-gray-500">
              {getRoleLabel(currentRole)}
            </span>
          </div>
        </div>
        <ChevronUp
          className={`w-4 h-4 text-gray-400 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* 드롭다운 메뉴 */}
      {isOpen && (
        <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-xl shadow-xl border border-gray-200 z-50">
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <span className="text-lg font-bold text-white">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">
                  {user.name}
                </p>
                <div className="flex items-center space-x-1 mt-1">
                  <Mail className="w-3 h-3 text-gray-400" />
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
                {currentRole && (
                  <div className="flex items-center space-x-1 mt-1">
                    {getRoleIcon(currentRole)}
                    <span className="text-xs text-gray-500">
                      {getRoleLabel(currentRole)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="p-2">
            <button
              onClick={() => {
                setIsOpen(false);
                // 프로필 설정 페이지로 이동하는 로직 추가 가능
              }}
              className="w-full flex items-center space-x-3 px-3 py-2 hover:bg-gray-50 rounded-lg transition-colors text-left"
            >
              <Settings className="w-4 h-4 text-gray-600" />
              <span className="text-sm text-gray-700">계정 설정</span>
            </button>

            <button
              onClick={() => {
                logout();
                setIsOpen(false);
              }}
              className="w-full flex items-center space-x-3 px-3 py-2 hover:bg-red-50 rounded-lg transition-colors text-left"
            >
              <LogOut className="w-4 h-4 text-red-600" />
              <span className="text-sm text-red-700">로그아웃</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
