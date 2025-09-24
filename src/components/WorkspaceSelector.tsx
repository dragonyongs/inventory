// src/components/WorkspaceSelector.tsx
import React, { useState, useEffect } from "react";
import { Building2, Plus, Check, Settings, ChevronDown, X } from "lucide-react";
import { useWorkspaceStore } from "../stores/workspaceStore";
import type { WorkspaceType } from "../stores/workspaceStore";
import {
  getWorkspaceTypeOptions,
  getWorkspaceTypeLabel,
} from "../utils/workspaceLabels";

// 🆕 공통 워크스페이스 모달 컴포넌트
export function WorkspaceModal({
  isOpen,
  onClose,
  mode = "create",
  workspace = null,
}: {
  isOpen: boolean;
  onClose: () => void;
  mode?: "create" | "edit";
  workspace?: any;
}) {
  // 🔧 필요한 스토어 훅들을 모두 가져오기
  const { createWorkspace, updateWorkspace, switchWorkspace, workspaces } =
    useWorkspaceStore();

  const [form, setForm] = useState({
    name: "",
    description: "",
    type: "DEFAULT" as WorkspaceType,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // 🔧 workspace prop이 변경될 때마다 form 상태 업데이트
  useEffect(() => {
    if (mode === "edit" && workspace) {
      console.log("수정 모드 - 워크스페이스 정보 로드:", workspace);
      setForm({
        name: workspace.name || "",
        description: workspace.description || "",
        type: workspace.type || "DEFAULT",
      });
    } else if (mode === "create") {
      // 생성 모드일 때는 폼 초기화
      setForm({
        name: "",
        description: "",
        type: "DEFAULT",
      });
    }
  }, [mode, workspace, isOpen]); // isOpen도 의존성에 추가하여 모달 열릴 때마다 업데이트

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
        // 중복 확인 후 생성
        const existingWorkspace = workspaces.find(
          (ws) =>
            ws.name.trim().toLowerCase() === form.name.trim().toLowerCase()
        );

        if (existingWorkspace) {
          // 기존 워크스페이스로 전환
          switchWorkspace(existingWorkspace.id);
          console.log("기존 워크스페이스로 전환:", existingWorkspace.name);
        } else {
          // 새 워크스페이스 생성
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

  const handleClose = () => {
    onClose();
    // 폼 리셋은 useEffect에서 처리됨
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>

        <div className="relative w-full max-w-md transform overflow-hidden rounded-lg bg-white p-6 text-left shadow-xl transition-all">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              {mode === "edit" ? "워크스페이스 수정" : "새 워크스페이스"}
            </h3>
            <button
              type="button"
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                워크스페이스 이름 *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="예: 창고 A, 매장 1호점"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                설명 (선택사항)
              </label>
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder="이 워크스페이스에 대한 간단한 설명을 입력하세요"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                워크스페이스 유형
              </label>
              <select
                value={form.type}
                onChange={(e) =>
                  setForm({ ...form, type: e.target.value as WorkspaceType })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {getWorkspaceTypeOptions().map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 디버깅용 정보 (개발 환경에서만) */}
            {import.meta.env.DEV && mode === "edit" && workspace && (
              <div className="text-xs text-gray-500 p-2 bg-gray-50 rounded">
                <div>디버깅: 수정 중인 워크스페이스</div>
                <div>ID: {workspace.id}</div>
                <div>이름: {workspace.name}</div>
                <div>유형: {workspace.type}</div>
              </div>
            )}

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !form.name.trim()}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "처리중..." : mode === "edit" ? "수정" : "생성"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// 워크스페이스 선택기 컴포넌트
export default function WorkspaceSelector() {
  const {
    workspaces,
    currentWorkspaceId,
    switchWorkspace,
    deleteWorkspace,
    getCurrentWorkspace,
  } = useWorkspaceStore();

  const [isOpen, setIsOpen] = useState(false);
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    mode: "create" | "edit";
    workspace?: any;
  }>({
    isOpen: false,
    mode: "create",
    workspace: null,
  });

  const currentWorkspace = getCurrentWorkspace();

  const handleCreateWorkspace = () => {
    console.log("새 워크스페이스 생성 모달 열기");
    setModalState({
      isOpen: true,
      mode: "create",
      workspace: null,
    });
  };

  const handleEditWorkspace = (workspace: any) => {
    console.log("워크스페이스 수정 모달 열기:", workspace);
    setModalState({
      isOpen: true,
      mode: "edit",
      workspace: workspace, // 전체 workspace 객체 전달
    });
  };

  const handleCloseModal = () => {
    setModalState({
      isOpen: false,
      mode: "create",
      workspace: null,
    });
  };

  const handleDeleteWorkspace = (workspaceId: string) => {
    const targetWorkspace = workspaces.find((ws) => ws.id === workspaceId);
    const workspaceName = targetWorkspace?.name || "워크스페이스";

    if (window.confirm(`정말로 "${workspaceName}"를 삭제하시겠습니까?`)) {
      deleteWorkspace(workspaceId);
    }
  };

  if (!currentWorkspace) {
    return (
      <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-center">
          <Building2 className="h-5 w-5 text-yellow-600 mr-2" />
          <span className="text-yellow-800">워크스페이스를 선택해주세요</span>
        </div>
        <button
          onClick={handleCreateWorkspace}
          className="mt-2 text-sm text-blue-600 hover:text-blue-800"
        >
          새 워크스페이스 생성
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6">
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="flex space-x-2 items-center w-full px-4 py-3 text-left bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <Building2 className="h-5 w-5 text-gray-400 mr-3" />
            <div className="flex-1">
              <div className="font-medium text-gray-900">
                {currentWorkspace.name}
              </div>
              {currentWorkspace.description && (
                <div className="text-sm text-gray-500">
                  {currentWorkspace.description}
                </div>
              )}
              <div className="text-xs text-gray-400 mt-1">
                {getWorkspaceTypeLabel(currentWorkspace.type)}
              </div>
            </div>
            <ChevronDown
              className={`h-5 w-5 text-gray-400 transition-transform ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {isOpen && (
            <div className="absolute bottom-16 left-0 right-0 z-10 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg">
              <div className="py-2">
                {/* 워크스페이스 목록 */}
                <div className="max-h-60 overflow-y-auto">
                  {workspaces.map((workspace) => (
                    <div
                      key={workspace.id}
                      className="px-4 py-2 hover:bg-gray-50"
                    >
                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => {
                            switchWorkspace(workspace.id);
                            setIsOpen(false);
                          }}
                          className="flex items-center flex-1 text-left"
                        >
                          <div className="flex-1">
                            <div className="flex items-center">
                              <span className="font-medium text-gray-900">
                                {workspace.name}
                              </span>
                              {workspace.id === currentWorkspaceId && (
                                <Check className="h-4 w-4 text-blue-600 ml-2" />
                              )}
                            </div>
                            {workspace.description && (
                              <div className="text-sm text-gray-500">
                                {workspace.description}
                              </div>
                            )}
                            <div className="text-xs text-gray-400">
                              {getWorkspaceTypeLabel(workspace.type)}
                            </div>
                          </div>
                        </button>

                        <div className="flex items-center space-x-2 ml-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditWorkspace(workspace);
                              setIsOpen(false);
                            }}
                            className="p-1 text-gray-400 hover:text-gray-600"
                            title="편집"
                          >
                            <Settings className="h-4 w-4" />
                          </button>

                          {workspaces.length > 1 &&
                            workspace.id !== "default-workspace" &&
                            workspace.id !== "user-workspace" && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteWorkspace(workspace.id);
                                  setIsOpen(false);
                                }}
                                className="p-1 text-gray-400 hover:text-red-600"
                                title="삭제"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 구분선 */}
                <div className="border-t border-gray-200 my-2" />

                {/* 새 워크스페이스 생성 */}
                <button
                  type="button"
                  onClick={() => {
                    handleCreateWorkspace();
                    setIsOpen(false);
                  }}
                  className="flex items-center w-full px-4 py-2 text-left text-blue-600 hover:bg-blue-50"
                >
                  <Plus className="h-4 w-4 mr-3" />
                  <span className="font-medium">새 워크스페이스 생성</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 워크스페이스 모달 */}
      <WorkspaceModal
        isOpen={modalState.isOpen}
        onClose={handleCloseModal}
        mode={modalState.mode}
        workspace={modalState.workspace}
      />
    </>
  );
}
