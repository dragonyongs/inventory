// src/components/settings/WorkspaceTab.tsx

import React, { useCallback, useState } from "react";
import {
  Plus,
  Edit3,
  Trash2,
  AlertCircle,
  Users,
  UserPlus,
} from "lucide-react";
import { useWorkspaceStore, type Workspace } from "../../stores/workspaceStore";
import { useAuthStore } from "../../stores/authStore";
import { WorkspaceFormData } from "../../types/workspace";
import { workspaceTypeOptions } from "../../constants/workspace";
import { getRoleInfo } from "../../utils/getRoleInfo";
import { InviteMemberModal } from "../workspace/InviteMemberModal";
import { PendingInvitations } from "../workspace/PendingInvitations";
import { WorkspaceMembersPanel } from "../workspace/WorkspaceMembersPanel";

export const WorkspaceTab: React.FC = React.memo(() => {
  const workspaceStore = useWorkspaceStore();
  const authStore = useAuthStore();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ✅ 초대 관련 state
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [invitingWorkspaceId, setInvitingWorkspaceId] = useState<string | null>(
    null
  );
  const [showMembersPanel, setShowMembersPanel] = useState<string | null>(null);
  const [_refreshKey, setRefreshKey] = useState(0);

  const [formData, setFormData] = useState<WorkspaceFormData>({
    name: "",
    description: "",
    type: "DEFAULT",
  });

  const currentUserId = authStore.user?.id || null;
  const workspaces = workspaceStore.workspaces;
  const currentWorkspaceId = workspaceStore.currentWorkspaceId;

  const handleCreate = useCallback(() => {
    if (!formData.name.trim()) return;
    workspaceStore.createWorkspace(formData);
    setFormData({ name: "", description: "", type: "DEFAULT" });
    setShowCreateForm(false);
  }, [formData, workspaceStore]);

  const handleUpdate = useCallback(
    (id: string) => {
      if (!formData.name.trim()) return;
      workspaceStore.updateWorkspace(id, formData);
      setEditingId(null);
      setFormData({ name: "", description: "", type: "DEFAULT" });
    },
    [formData, workspaceStore]
  );

  const handleDelete = useCallback(
    (id: string) => {
      workspaceStore.deleteWorkspace(id);
      setDeletingId(null);
    },
    [workspaceStore]
  );

  const startEdit = useCallback((workspace: Workspace) => {
    setEditingId(workspace.id);
    setFormData({
      name: workspace.name,
      description: workspace.description || "",
      type: workspace.type,
    });
  }, []);

  const cancelEdit = useCallback(() => {
    setEditingId(null);
    setFormData({ name: "", description: "", type: "DEFAULT" });
  }, []);

  // ✅ 초대 핸들러
  const handleOpenInviteModal = useCallback((workspaceId: string) => {
    setInvitingWorkspaceId(workspaceId);
    setInviteModalOpen(true);
  }, []);

  const handleCloseInviteModal = useCallback(() => {
    setInviteModalOpen(false);
    setInvitingWorkspaceId(null);
  }, []);

  // ✅ 초대 성공 시 UI 업데이트
  const handleInviteSuccess = useCallback(() => {
    setRefreshKey((prev) => prev + 1); // 강제 리렌더링
    console.log("🔄 초대 목록 새로고침");
  }, []);

  return (
    <div className="space-y-6">
      {/* 헤더 영역 */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">워크스페이스</h3>
          <p className="text-sm text-gray-500 mt-1">
            모든 워크스페이스를 보고 관리하세요
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
        >
          <Plus className="w-4 h-4" />새 워크스페이스
        </button>
      </div>

      {/* ✅ 받은 초대 표시 */}
      <PendingInvitations />

      {/* 생성 폼 */}
      {showCreateForm && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
          <h4 className="text-base font-semibold text-gray-900">
            새 워크스페이스 만들기
          </h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                워크스페이스 이름
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="예: 본사 창고"
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-shadow"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                설명 (선택)
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="워크스페이스 설명을 입력하세요"
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-shadow"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                유형
              </label>
              <select
                value={formData.type}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    type: e.target.value as WorkspaceFormData["type"],
                  })
                }
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-shadow"
              >
                {workspaceTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label} - {option.description}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={handleCreate}
                className="flex-1 px-4 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
              >
                생성
              </button>
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  setFormData({ name: "", description: "", type: "DEFAULT" });
                }}
                className="flex-1 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 워크스페이스 리스트 */}
      {workspaces.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <div className="text-gray-400 mb-3">
            <AlertCircle className="w-12 h-12 mx-auto" />
          </div>
          <h4 className="text-base font-medium text-gray-900 mb-1">
            워크스페이스가 없습니다
          </h4>
          <p className="text-sm text-gray-500 mb-4">
            새 워크스페이스를 만들어 시작하세요
          </p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            워크스페이스 만들기
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {workspaces.map((workspace) => {
            const isActive = workspace.id === currentWorkspaceId;
            const isEditing = editingId === workspace.id;
            const userRole = currentUserId
              ? workspaceStore.getUserRole(workspace.id, currentUserId)
              : "owner";
            const roleInfo = getRoleInfo(userRole);
            const typeInfo = workspaceTypeOptions.find(
              (opt) => opt.value === workspace.type
            );

            const WorkspaceIcon = typeInfo?.icon;
            const RoleIcon = roleInfo.icon;
            const canInvite = userRole === "owner" || userRole === "admin";
            const isShowingMembers = showMembersPanel === workspace.id;

            if (isEditing) {
              return (
                <div
                  key={workspace.id}
                  className="bg-white rounded-lg border border-gray-200 p-6 space-y-4"
                >
                  <h4 className="text-base font-semibold text-gray-900">
                    워크스페이스 수정
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        워크스페이스 이름
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        설명
                      </label>
                      <input
                        type="text"
                        value={formData.description}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            description: e.target.value,
                          })
                        }
                        className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        유형
                      </label>
                      <select
                        value={formData.type}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            type: e.target.value as WorkspaceFormData["type"],
                          })
                        }
                        className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                      >
                        {workspaceTypeOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => handleUpdate(workspace.id)}
                        className="flex-1 px-4 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
                      >
                        저장
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="flex-1 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        취소
                      </button>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={workspace.id}
                className={`bg-white rounded-lg border transition-all ${
                  isActive
                    ? "border-blue-500 shadow-sm ring-1 ring-blue-500"
                    : "border-gray-200"
                }`}
              >
                <div className="p-5">
                  <div className="flex items-start justify-between">
                    {/* 왼쪽: 아이콘 + 정보 */}
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      {/* 아이콘 */}
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                        {WorkspaceIcon && (
                          <WorkspaceIcon className="w-6 h-6 text-white" />
                        )}
                      </div>

                      {/* 정보 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-base font-semibold text-gray-900 truncate">
                            {workspace.name}
                          </h4>
                          {isActive && (
                            <span className="px-2 py-0.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-full">
                              활성
                            </span>
                          )}
                        </div>
                        {workspace.description && (
                          <p className="text-sm text-gray-600 mb-2 line-clamp-1">
                            {workspace.description}
                          </p>
                        )}
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            {typeInfo?.label}
                          </span>
                          <span>•</span>
                          <span>
                            {new Date(workspace.createdAt).toLocaleDateString(
                              "ko-KR"
                            )}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-2">
                          {RoleIcon && (
                            <RoleIcon className="w-3.5 h-3.5 text-gray-500" />
                          )}
                          <span className="text-xs font-medium text-gray-700">
                            {roleInfo.label}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 오른쪽: 액션 버튼 */}
                    <div className="flex items-center gap-1 ml-4">
                      {/* ✅ 멤버 관리 버튼 */}
                      {canInvite && (
                        <button
                          onClick={() =>
                            setShowMembersPanel(
                              isShowingMembers ? null : workspace.id
                            )
                          }
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          title="멤버 관리"
                        >
                          <Users className="w-5 h-5" />
                        </button>
                      )}

                      {/* ✅ 초대 버튼 */}
                      {canInvite && (
                        <button
                          onClick={() => handleOpenInviteModal(workspace.id)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="멤버 초대"
                        >
                          <UserPlus className="w-5 h-5" />
                        </button>
                      )}

                      {userRole === "owner" || userRole === "admin" ? (
                        <>
                          <button
                            onClick={() => startEdit(workspace)}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            title="수정"
                          >
                            <Edit3 className="w-5 h-5" />
                          </button>
                          {userRole === "owner" && (
                            <button
                              onClick={() => setDeletingId(workspace.id)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="삭제"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          )}
                        </>
                      ) : null}
                    </div>
                  </div>
                </div>

                {/* ✅ 멤버 패널 */}
                {isShowingMembers && (
                  <WorkspaceMembersPanel
                    workspaceId={workspace.id}
                    currentUserId={currentUserId}
                    userRole={userRole}
                  />
                )}

                {/* 삭제 확인 모달 */}
                {deletingId === workspace.id && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 m-4">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                          <AlertCircle className="w-5 h-5 text-red-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            정말 삭제하시겠습니까?
                          </h3>
                          <p className="text-sm text-gray-600">
                            이 워크스페이스와 관련된 모든 데이터가 삭제됩니다.
                            이 작업은 되돌릴 수 없습니다.
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-3 mt-6">
                        <button
                          onClick={() => handleDelete(workspace.id)}
                          className="flex-1 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
                        >
                          삭제
                        </button>
                        <button
                          onClick={() => setDeletingId(null)}
                          className="flex-1 px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          취소
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ✅ 초대 모달 */}
      {invitingWorkspaceId && (
        <InviteMemberModal
          isOpen={inviteModalOpen}
          onClose={handleCloseInviteModal}
          workspaceId={invitingWorkspaceId}
          workspaceName={
            workspaces.find((ws) => ws.id === invitingWorkspaceId)?.name || ""
          }
          onInviteSuccess={handleInviteSuccess}
        />
      )}
    </div>
  );
});

WorkspaceTab.displayName = "WorkspaceTab";
