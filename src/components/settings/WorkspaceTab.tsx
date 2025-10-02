import React, { useCallback, useState } from "react";
import { Plus, Edit3, Trash2, AlertCircle, Users } from "lucide-react";
import { useWorkspaceStore, type Workspace } from "../../stores/workspaceStore";
import { useAuthStore } from "../../stores/authStore";
import { WorkspaceFormData } from "../../types/workspace";
import { workspaceTypeOptions } from "../../constants/workspace";
import { getRoleInfo } from "../../utils/getRoleInfo";

export const WorkspaceTab: React.FC = React.memo(() => {
  const workspaceStore = useWorkspaceStore();
  const authStore = useAuthStore();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
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

  return (
    <div className="max-w-5xl mx-auto">
      {/* 헤더 영역 */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-semibold text-gray-900">워크스페이스</h2>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
          >
            <Plus className="w-4 h-4" />새 워크스페이스
          </button>
        </div>
        <p className="text-sm text-gray-500">
          모든 워크스페이스를 보고 관리하세요
        </p>
      </div>

      {/* 생성 폼 */}
      {showCreateForm && (
        <div className="mb-6 p-6 bg-white border border-gray-200 rounded-xl shadow-sm">
          <h3 className="text-base font-semibold text-gray-900 mb-4">
            새 워크스페이스 만들기
          </h3>
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
            <div className="flex gap-3 pt-2">
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
      <div className="space-y-3">
        {workspaces.length === 0 ? (
          <div className="text-center py-16 bg-white border border-gray-200 rounded-xl">
            <div className="w-12 h-12 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 text-gray-400" />
            </div>
            <h3 className="text-base font-medium text-gray-900 mb-1">
              워크스페이스가 없습니다
            </h3>
            <p className="text-sm text-gray-500 mb-6">
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
          workspaces.map((workspace) => {
            const isActive = workspace.id === currentWorkspaceId;
            const isEditing = editingId === workspace.id;
            const userRole = currentUserId
              ? workspaceStore.getUserRole(workspace.id, currentUserId)
              : "owner";
            const roleInfo = getRoleInfo(userRole);
            const typeInfo = workspaceTypeOptions.find(
              (opt) => opt.value === workspace.type
            );

            // 🔥 핵심: 아이콘 컴포넌트를 변수로 추출
            const WorkspaceIcon = typeInfo?.icon;
            const RoleIcon = roleInfo.icon;

            if (isEditing) {
              return (
                <div
                  key={workspace.id}
                  className="p-6 bg-white border border-gray-300 rounded-xl shadow-sm"
                >
                  <h3 className="text-base font-semibold text-gray-900 mb-4">
                    워크스페이스 수정
                  </h3>
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
                    <div className="flex gap-3 pt-2">
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
                className={`group p-5 bg-white border rounded-xl transition-all hover:shadow-md ${
                  isActive
                    ? "border-gray-900 shadow-sm"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    {/* 🔥 아이콘 - 컴포넌트로 렌더링 */}
                    <div
                      className={`flex-shrink-0 w-11 h-11 rounded-lg flex items-center justify-center ${
                        isActive
                          ? "bg-gray-900 text-white"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {WorkspaceIcon && <WorkspaceIcon className="w-5 h-5" />}
                    </div>
                    {/* 정보 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3
                          className="font-semibold text-gray-900 truncate max-w-[240px]"
                          title={workspace.name}
                        >
                          {workspace.name}
                        </h3>
                        {isActive && (
                          <span className="flex-shrink-0 px-2 py-0.5 bg-gray-900 text-white text-xs font-medium rounded">
                            활성
                          </span>
                        )}
                      </div>
                      {workspace.description && (
                        <p
                          className="text-sm text-gray-500 mb-2 truncate max-w-[280px]"
                          title={workspace.description}
                        >
                          {workspace.description}
                        </p>
                      )}
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span>{typeInfo?.label}</span>
                        <span>•</span>
                        <span>
                          {new Date(workspace.createdAt).toLocaleDateString(
                            "ko-KR"
                          )}
                        </span>
                        <span>•</span>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded ${roleInfo.bgColor} ${roleInfo.color}`}
                        >
                          {/* 🔥 역할 아이콘 - 컴포넌트로 렌더링 */}
                          {RoleIcon && <RoleIcon className="w-3 h-3" />}
                          {roleInfo.label}
                        </span>
                      </div>
                    </div>
                  </div>
                  {/* 액션 버튼 */}
                  <div className="flex items-center gap-2 ml-4">
                    {userRole === "owner" || userRole === "admin" ? (
                      <>
                        <button
                          onClick={() => startEdit(workspace)}
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingId(workspace.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    ) : null}
                  </div>
                </div>

                {/* 삭제 확인 모달 */}
                {deletingId === workspace.id && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-start gap-3 p-4 bg-red-50 rounded-lg mb-3">
                      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-red-900 mb-1">
                          정말 삭제하시겠습니까?
                        </p>
                        <p className="text-xs text-red-700">
                          이 워크스페이스와 관련된 모든 데이터가 삭제됩니다. 이
                          작업은 되돌릴 수 없습니다.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
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
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
});

WorkspaceTab.displayName = "WorkspaceTab";
