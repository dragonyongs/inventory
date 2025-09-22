// src/components/WorkspaceSelector.tsx (개선된 버전)
import { useState, useRef, useEffect, useMemo } from "react";
import {
  ChevronDown,
  Plus,
  Building2,
  Check,
  Settings,
  Users,
  Crown,
} from "lucide-react";
import { useWorkspaceStore } from "../stores/workspaceStore";
import { useAuthStore } from "../stores/authStore";

export const WorkspaceSelector = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [newWorkspaceDescription, setNewWorkspaceDescription] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const currentWorkspaceId = useWorkspaceStore((s) => s.currentWorkspaceId);
  const setCurrentWorkspaceId = useWorkspaceStore(
    (s) => s.setCurrentWorkspaceId
  );
  const createWorkspace = useWorkspaceStore((s) => s.createWorkspace);
  const getUserRole = useWorkspaceStore((s) => s.getUserRole);
  const user = useAuthStore((s) => s.user);

  // 현재 워크스페이스 메모이제이션
  const currentWorkspace = useMemo(
    () => workspaces.find((ws) => ws.id === currentWorkspaceId),
    [workspaces, currentWorkspaceId]
  );

  const handleWorkspaceSelect = (workspaceId: string) => {
    setCurrentWorkspaceId(workspaceId);
    setIsOpen(false);
  };

  // 외부 클릭시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setShowCreateForm(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCreateWorkspace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) return;

    try {
      createWorkspace(
        newWorkspaceName.trim(),
        newWorkspaceDescription.trim() || undefined
      );
      setNewWorkspaceName("");
      setNewWorkspaceDescription("");
      setShowCreateForm(false);
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to create workspace:", error);
    }
  };

  const getRoleIcon = (workspaceId: string) => {
    if (!user) return null;
    const role = getUserRole(workspaceId, user.id);
    return role === "owner" ? (
      <Crown className="w-4 h-4 text-yellow-600" />
    ) : role === "admin" ? (
      <Settings className="w-4 h-4 text-blue-600" />
    ) : (
      <Users className="w-4 h-4 text-gray-600" />
    );
  };

  const getDisplayText = () => {
    if (!currentWorkspace) return "워크스페이스 선택";
    return currentWorkspace.name;
  };

  const getCurrentRole = () => {
    if (!currentWorkspace || !user) return null;
    return getUserRole(currentWorkspace.id, user.id);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-blue-50 hover:from-gray-100 hover:to-blue-100 rounded-lg transition-colors group"
      >
        <div className="flex items-center space-x-3">
          <Building2 className="w-5 h-5 text-blue-600" />
          <div className="text-left">
            <div className="font-medium text-gray-900">{getDisplayText()}</div>
            {currentWorkspace && getCurrentRole() && (
              <div className="text-xs text-gray-500 flex items-center space-x-1">
                {getRoleIcon(currentWorkspace.id)}
                <span>{getCurrentRole()}</span>
              </div>
            )}
          </div>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-gray-500 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* 드롭다운 메뉴 */}
      {isOpen && (
        <div className="absolute right-0 left-0 bottom-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-2">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider px-3 py-2">
              워크스페이스
            </div>

            {/* 워크스페이스 목록 */}
            {workspaces.map((workspace) => (
              <button
                key={workspace.id}
                onClick={() => handleWorkspaceSelect(workspace.id)}
                className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <Building2 className="w-4 h-4 text-gray-400" />
                  <div className="text-left">
                    <div className="font-medium text-gray-900">
                      {workspace.name}
                    </div>
                    <div className="text-xs text-gray-500 flex items-center space-x-2">
                      {getRoleIcon(workspace.id)}
                      <span>{workspace.members.length}명</span>
                    </div>
                  </div>
                </div>
                {currentWorkspaceId === workspace.id && (
                  <Check className="w-4 h-4 text-blue-600" />
                )}
              </button>
            ))}

            {/* 구분선 */}
            <div className="border-t border-gray-200 my-2" />

            {/* 워크스페이스 생성 */}
            {showCreateForm ? (
              <form onSubmit={handleCreateWorkspace} className="p-3 space-y-3">
                <input
                  type="text"
                  value={newWorkspaceName}
                  onChange={(e) => setNewWorkspaceName(e.target.value)}
                  placeholder="워크스페이스 이름"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoFocus
                />
                <textarea
                  value={newWorkspaceDescription}
                  onChange={(e) => setNewWorkspaceDescription(e.target.value)}
                  placeholder="설명 (선택)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={2}
                />
                <div className="flex space-x-2">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors"
                  >
                    생성
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="flex-1 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-sm hover:bg-gray-200 transition-colors"
                  >
                    취소
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setShowCreateForm(true)}
                className="w-full flex items-center space-x-3 p-3 hover:bg-gray-50 transition-colors text-left rounded-lg"
              >
                <Plus className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-gray-900">
                  새 워크스페이스
                </span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
