// src/components/WorkspaceSelector.tsx

import React, { useState } from "react";
import {
  Building2,
  Plus,
  Check,
  Users,
  Settings,
  ChevronDown,
  X,
} from "lucide-react";
import { useWorkspaceStore } from "../stores/workspaceStore";
import type { WorkspaceType } from "../stores/workspaceStore";
import { useAuthStore } from "../stores/authStore";
import {
  getWorkspaceTypeOptions,
  getWorkspaceTypeLabel,
} from "../utils/workspaceLabels";

export default function WorkspaceSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const {
    workspaces,
    currentWorkspaceId,
    setCurrentWorkspaceId,
    createWorkspace,
    getCurrentWorkspace,
  } = useWorkspaceStore();
  const user = useAuthStore((state) => state.user);

  const currentWorkspace = getCurrentWorkspace();

  const [newWorkspace, setNewWorkspace] = useState({
    name: "",
    description: "",
    type: "DEFAULT" as WorkspaceType,
  });

  const handleCreateWorkspace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkspace.name.trim() || !user) return;

    createWorkspace({
      name: newWorkspace.name.trim(),
      description: newWorkspace.description.trim(),
      type: newWorkspace.type,
      ownerId: user.id,
      members: [
        {
          userId: user.id,
          email: user.email,
          name: user.name,
          role: "owner",
          joinedAt: new Date().toISOString(),
          invitedBy: user.id,
        },
      ],
      settings: {
        allowMemberInvite: true,
        defaultRole: "member",
      },
    });

    setNewWorkspace({ name: "", description: "", type: "DEFAULT" });
    setShowCreateForm(false);
    setIsOpen(false);
  };

  const handleSelectWorkspace = (workspaceId: string) => {
    setCurrentWorkspaceId(workspaceId);
    setIsOpen(false);
  };

  const typeOptions = getWorkspaceTypeOptions();

  if (showCreateForm) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl max-w-md w-full p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <Plus className="w-5 h-5 mr-2" />새 워크스페이스
            </h2>
            <button
              onClick={() => setShowCreateForm(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleCreateWorkspace} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                워크스페이스 이름 *
              </label>
              <input
                type="text"
                value={newWorkspace.name}
                onChange={(e) =>
                  setNewWorkspace({ ...newWorkspace, name: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="예: 마케팅팀 재고"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                워크스페이스 타입 *
              </label>
              <select
                value={newWorkspace.type}
                onChange={(e) =>
                  setNewWorkspace({
                    ...newWorkspace,
                    type: e.target.value as WorkspaceType,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {typeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label} - {option.description}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                워크스페이스 타입에 따라 재고 관리 방식이 달라집니다
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                설명 (선택)
              </label>
              <textarea
                value={newWorkspace.description}
                onChange={(e) =>
                  setNewWorkspace({
                    ...newWorkspace,
                    description: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="워크스페이스에 대한 간단한 설명을 입력하세요"
                rows={3}
              />
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                취소
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                생성
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 w-full p-3 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <div className="p-2 bg-blue-100 rounded-lg">
          <Building2 className="w-5 h-5 text-blue-600" />
        </div>
        <div className="flex-1 text-left">
          <div className="font-medium text-gray-900 flex items-center">
            {currentWorkspace ? (
              <>
                {/* {getWorkspaceTypeLabel(currentWorkspace.type || "DEFAULT")} */}
                <span className="text-sm">{currentWorkspace.name}</span>
              </>
            ) : (
              "워크스페이스 선택"
            )}
          </div>
          <div className="text-xs text-gray-500">
            {currentWorkspace?.description || "워크스페이스를 선택하세요"}
          </div>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute bottom-0 left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-80 overflow-y-auto">
          <div className="p-2">
            <button
              onClick={() => {
                setShowCreateForm(true);
                setIsOpen(false);
              }}
              className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 text-blue-600"
            >
              <div className="p-2 bg-blue-100 rounded-lg">
                <Plus className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="font-medium">새 워크스페이스 만들기</div>
                <div className="text-sm text-gray-500">
                  새로운 공간을 생성하세요
                </div>
              </div>
            </button>
          </div>

          <div className="border-t border-gray-200">
            <div className="p-2">
              {!workspaces || workspaces.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  <Building2 className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">워크스페이스가 없습니다</p>
                  <p className="text-xs text-gray-400">새로 만들어보세요</p>
                </div>
              ) : (
                workspaces.map((workspace) => {
                  // 🔧 안전하게 members 배열 처리
                  const memberCount = Array.isArray(workspace.members)
                    ? workspace.members.length
                    : 0;

                  return (
                    <button
                      key={workspace.id}
                      onClick={() => handleSelectWorkspace(workspace.id)}
                      className={`w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 ${
                        currentWorkspaceId === workspace.id
                          ? "bg-blue-50 border border-blue-200"
                          : ""
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={`p-2 rounded-lg ${
                            currentWorkspaceId === workspace.id
                              ? "bg-blue-100"
                              : "bg-gray-100"
                          }`}
                        >
                          <Building2
                            className={`w-4 h-4 ${
                              currentWorkspaceId === workspace.id
                                ? "text-blue-600"
                                : "text-gray-600"
                            }`}
                          />
                        </div>
                        <div className="text-left">
                          <div className="font-medium text-gray-900 flex items-center">
                            {/* {getWorkspaceTypeLabel(workspace.type || "DEFAULT")} */}
                            <span>{workspace.name}</span>
                          </div>
                          {workspace.description && (
                            <div className="text-sm text-gray-500">
                              {workspace.description}
                            </div>
                          )}
                          <div className="flex items-center space-x-4 mt-1">
                            <div className="flex items-center text-xs text-gray-400">
                              <Users className="w-3 h-3 mr-1" />
                              {memberCount}명
                            </div>
                          </div>
                        </div>
                      </div>
                      {currentWorkspaceId === workspace.id && (
                        <Check className="w-4 h-4 text-blue-600" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
