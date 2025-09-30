// src/components/WorkspaceSelector.tsx
import React, { useState, useEffect, useRef } from "react";
import {
  Building2,
  Plus,
  Check,
  Settings,
  ChevronDown,
  X,
  Trash2,
} from "lucide-react";
import { useWorkspaceStore } from "../stores/workspaceStore";
import type { WorkspaceType } from "../stores/workspaceStore";
import {
  getWorkspaceTypeOptions,
  // getWorkspaceTypeLabel,
} from "../utils/workspaceLabels";

interface WorkspaceSelectorProps {
  variant?: "default" | "compact";
}

export default function WorkspaceSelector({
  variant = "default",
}: WorkspaceSelectorProps) {
  const {
    workspaces,
    currentWorkspaceId,
    switchWorkspace,
    deleteWorkspace,
    getCurrentWorkspace,
  } = useWorkspaceStore();

  const [isOpen, setIsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingWorkspace, setEditingWorkspace] = useState<any>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 현재 워크스페이스 가져오기
  const currentWorkspace = getCurrentWorkspace();

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

  const handleOpenModal = (mode: "create" | "edit", workspace?: any) => {
    setModalMode(mode);
    setEditingWorkspace(workspace || null);
    setIsModalOpen(true);
    setIsOpen(false);
  };

  const handleDeleteWorkspace = (
    workspaceId: string,
    workspaceName: string
  ) => {
    if (confirm(`정말로 "${workspaceName}"를 삭제하시겠습니까?`)) {
      deleteWorkspace(workspaceId);
    }
  };

  // Compact 변형 - 노션 스타일
  if (variant === "compact") {
    if (!currentWorkspace) {
      return (
        <div className="px-3 py-2 text-sm text-gray-500">
          워크스페이스를 불러오는 중...
        </div>
      );
    }

    return (
      <>
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg
                     hover:bg-gray-50 transition-all duration-200 group"
            aria-expanded={isOpen}
          >
            <div className="flex items-center space-x-2 min-w-0 flex-1">
              <div
                className="w-5 h-5 rounded flex-shrink-0 flex items-center justify-center
                          bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-xs font-medium"
              >
                {currentWorkspace.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium text-gray-700 truncate">
                {currentWorkspace.name}
              </span>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-gray-400 transition-transform duration-200 flex-shrink-0
                         ${isOpen ? "rotate-180" : ""}`}
            />
          </button>

          {isOpen && (
            <div
              className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg 
                        border border-gray-200 py-2 z-50 max-h-80 overflow-y-auto"
            >
              {/* 워크스페이스 목록 */}
              <div className="px-2 pb-2">
                {workspaces.map((ws) => (
                  <button
                    key={ws.id}
                    onClick={() => {
                      switchWorkspace(ws.id);
                      setIsOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 
                             rounded-md hover:bg-gray-50 transition-colors group"
                  >
                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                      <div
                        className="w-6 h-6 rounded flex-shrink-0 flex items-center justify-center
                                  bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-xs font-medium"
                      >
                        {ws.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="text-left min-w-0 flex-1">
                        <div className="text-sm font-medium text-gray-700 truncate">
                          {ws.name}
                        </div>
                        {ws.description && (
                          <div className="text-xs text-gray-500 truncate">
                            {ws.description}
                          </div>
                        )}
                      </div>
                    </div>
                    {currentWorkspaceId === ws.id && (
                      <Check className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>

              <div className="border-t border-gray-100 my-1" />

              {/* 액션 버튼 */}
              <div className="px-2">
                <button
                  onClick={() => handleOpenModal("create")}
                  className="w-full flex items-center space-x-2 px-3 py-2 
                           text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>워크스페이스 추가</span>
                </button>
                <button
                  onClick={() => handleOpenModal("edit", currentWorkspace)}
                  className="w-full flex items-center space-x-2 px-3 py-2 
                           text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  <span>워크스페이스 설정</span>
                </button>
              </div>
            </div>
          )}
        </div>

        <WorkspaceModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          mode={modalMode}
          workspace={editingWorkspace}
          onDelete={handleDeleteWorkspace}
        />
      </>
    );
  }

  // 기본 변형 (기존 UI)
  if (!currentWorkspace) {
    return (
      <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-sm text-yellow-800">
          워크스페이스를 불러올 수 없습니다.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6 bg-white border border-gray-200 rounded-lg shadow-sm">
        {/* 현재 워크스페이스 표시 */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors rounded-lg"
        >
          <div className="flex items-center space-x-3">
            <Building2 className="w-5 h-5 text-blue-600" />
            <div className="flex-1">
              <div className="font-medium text-gray-900">
                {currentWorkspace.name}
              </div>
              {currentWorkspace.description && (
                <div className="text-sm text-gray-500">
                  {currentWorkspace.description}
                </div>
              )}
            </div>
          </div>
          <ChevronDown
            className={`w-5 h-5 text-gray-400 transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {/* 드롭다운 목록 */}
        {isOpen && (
          <div className="border-t border-gray-200">
            <div className="p-2 max-h-64 overflow-y-auto">
              {workspaces.map((ws) => (
                <button
                  key={ws.id}
                  onClick={() => {
                    switchWorkspace(ws.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                    currentWorkspaceId === ws.id
                      ? "bg-blue-50 border border-blue-200"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <div className="flex-1 text-left">
                    <div className="font-medium text-gray-900">{ws.name}</div>
                    {ws.description && (
                      <div className="text-sm text-gray-500">
                        {ws.description}
                      </div>
                    )}
                  </div>
                  {currentWorkspaceId === ws.id && (
                    <Check className="w-5 h-5 text-blue-600" />
                  )}
                </button>
              ))}
            </div>

            <div className="border-t border-gray-200 p-2 space-y-1">
              <button
                onClick={() => handleOpenModal("create")}
                className="w-full flex items-center space-x-2 p-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>새 워크스페이스</span>
              </button>
              <button
                onClick={() => handleOpenModal("edit", currentWorkspace)}
                className="w-full flex items-center space-x-2 p-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <Settings className="w-4 h-4" />
                <span>설정</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <WorkspaceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        mode={modalMode}
        workspace={editingWorkspace}
        onDelete={handleDeleteWorkspace}
      />
    </>
  );
}

// WorkspaceModal - 삭제 기능 추가
export function WorkspaceModal({
  isOpen,
  onClose,
  mode = "create",
  workspace = null,
  onDelete,
}: {
  isOpen: boolean;
  onClose: () => void;
  mode?: "create" | "edit";
  workspace?: any;
  onDelete?: (workspaceId: string, workspaceName: string) => void;
}) {
  const { createWorkspace, updateWorkspace, switchWorkspace, workspaces } =
    useWorkspaceStore();
  const [form, setForm] = useState({
    name: "",
    description: "",
    type: "DEFAULT" as WorkspaceType,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (mode === "edit" && workspace) {
      console.log("수정 모드 - 워크스페이스 정보 로드:", workspace);
      setForm({
        name: workspace.name || "",
        description: workspace.description || "",
        type: workspace.type || "DEFAULT",
      });
    } else if (mode === "create") {
      setForm({
        name: "",
        description: "",
        type: "DEFAULT",
      });
    }
  }, [mode, workspace, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    setIsSubmitting(true);
    try {
      if (mode === "edit" && workspace) {
        console.log("워크스페이스 업데이트:", {
          id: workspace.id,
          updates: {
            name: form.name.trim(),
            description: form.description.trim(),
            type: form.type,
          },
        });
        updateWorkspace(workspace.id, {
          name: form.name.trim(),
          description: form.description.trim(),
          type: form.type,
        });
      } else {
        const existingWorkspace = workspaces.find(
          (ws) =>
            ws.name.trim().toLowerCase() === form.name.trim().toLowerCase()
        );
        if (existingWorkspace) {
          switchWorkspace(existingWorkspace.id);
          console.log("기존 워크스페이스로 전환:", existingWorkspace.name);
        } else {
          createWorkspace({
            name: form.name.trim(),
            description: form.description.trim(),
            type: form.type,
          });
        }
      }
      onClose();
    } catch (error) {
      console.error("워크스페이스 처리 실패:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = () => {
    if (workspace && onDelete) {
      onDelete(workspace.id, workspace.name);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {mode === "edit" ? "워크스페이스 수정" : "새 워크스페이스"}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              이름 *
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg
                       focus:ring-2 focus:ring-blue-500 focus:border-transparent
                       transition-all"
              placeholder="워크스페이스 이름"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              설명
            </label>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg
                       focus:ring-2 focus:ring-blue-500 focus:border-transparent
                       transition-all resize-none"
              placeholder="간단한 설명 (선택)"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              타입
            </label>
            <select
              value={form.type}
              onChange={(e) =>
                setForm({ ...form, type: e.target.value as WorkspaceType })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg
                       focus:ring-2 focus:ring-blue-500 focus:border-transparent
                       transition-all"
            >
              {getWorkspaceTypeOptions().map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-gray-200">
            {/* 삭제 버튼 (수정 모드일 때만) */}
            <div>
              {mode === "edit" && workspace && workspaces.length > 1 && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="flex items-center space-x-2 px-3 py-2 text-sm font-medium 
                           text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  disabled={isSubmitting}
                >
                  <Trash2 className="w-4 h-4" />
                  <span>삭제</span>
                </button>
              )}
            </div>

            {/* 기본 버튼들 */}
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 
                         hover:bg-gray-100 rounded-lg transition-colors"
                disabled={isSubmitting}
              >
                취소
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white 
                         bg-blue-600 hover:bg-blue-700 rounded-lg 
                         transition-colors disabled:opacity-50"
                disabled={isSubmitting}
              >
                {isSubmitting ? "처리중..." : mode === "edit" ? "수정" : "생성"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
