// src/components/WorkspaceSelector.tsx
import { useState, useRef, useEffect } from "react";
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
  const currentId = useWorkspaceStore((s) => s.currentId);
  const setCurrentWorkspaceId = useWorkspaceStore(
    (s) => s.setCurrentWorkspaceId
  ); // ✅ 올바른 함수명
  const createWorkspace = useWorkspaceStore((s) => s.createWorkspace);
  const getUserRole = useWorkspaceStore((s) => s.getUserRole);
  const user = useAuthStore((s) => s.user);

  const currentWorkspace = workspaces.find((ws) => ws.id === currentId);

  const handleWorkspaceSelect = (workspaceId: string) => {
    setCurrentWorkspaceId(workspaceId); // ✅ 올바른 호출
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
      <Crown className="w-4 h-4 text-yellow-500" />
    ) : role === "admin" ? (
      <Settings className="w-4 h-4 text-blue-500" />
    ) : (
      <Users className="w-4 h-4 text-gray-500" />
    );
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-blue-50 hover:from-gray-100 hover:to-blue-100 rounded-lg transition-colors group"
      >
        <div className="flex items-center space-x-3 min-w-0 flex-1">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <Building2 className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0 flex-1 text-left">
            <p className="font-medium text-gray-900 truncate">
              {currentWorkspace?.name || "워크스페이스 선택"}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {currentWorkspace &&
                user &&
                getUserRole(currentWorkspace.id, user.id)}
            </p>
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
        <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-xl shadow-xl border border-gray-200 z-50">
          <div className="p-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">
              워크스페이스
            </h3>
          </div>

          {/* 워크스페이스 목록 */}
          <div className="max-h-60 overflow-y-auto">
            {workspaces.map((workspace) => (
              <button
                key={workspace.id}
                onClick={() => handleWorkspaceSelect(workspace.id)}
                className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  <div className="w-6 h-6 bg-gradient-to-r from-blue-400 to-blue-500 rounded flex items-center justify-center">
                    <Building2 className="w-3 h-3 text-white" />
                  </div>
                  <div className="min-w-0 flex-1 text-left">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {workspace.name}
                    </p>
                    <div className="flex items-center space-x-1">
                      {getRoleIcon(workspace.id)}
                      <span className="text-xs text-gray-500">
                        {workspace.members.length}명
                      </span>
                    </div>
                  </div>
                </div>
                {currentId === workspace.id && (
                  <Check className="w-4 h-4 text-blue-600" />
                )}
              </button>
            ))}
          </div>

          {/* 워크스페이스 생성 */}
          <div className="border-t border-gray-100">
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
                <input
                  type="text"
                  value={newWorkspaceDescription}
                  onChange={(e) => setNewWorkspaceDescription(e.target.value)}
                  placeholder="설명 (선택)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                className="w-full flex items-center space-x-3 p-3 hover:bg-gray-50 transition-colors text-left"
              >
                <div className="w-6 h-6 border-2 border-dashed border-gray-300 rounded flex items-center justify-center">
                  <Plus className="w-3 h-3 text-gray-400" />
                </div>
                <span className="text-sm font-medium text-gray-700">
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
