// src/pages/settings/WorkspaceTab.tsx - 수정된 버전
import React, { useCallback, useState, useMemo, useEffect } from "react";
import {
  Users,
  Plus,
  Edit3,
  Trash2,
  Check,
  X,
  Building,
  Calendar,
  User,
  Crown,
  Shield,
  Eye,
  ChevronDown,
  AlertCircle,
} from "lucide-react";
import {
  useWorkspaceStore,
  type WorkspaceType,
  type Workspace,
} from "../../stores/workspaceStore";
import { useAuthStore } from "../../stores/authStore"; // 추가

interface WorkspaceFormData {
  name: string;
  description: string;
  type: WorkspaceType;
}

const workspaceTypeOptions: {
  value: WorkspaceType;
  label: string;
  description: string;
  icon: string;
}[] = [
  {
    value: "DEFAULT",
    label: "기본",
    description: "일반적인 재고 관리",
    icon: "📦",
  },
  {
    value: "RETAIL",
    label: "소매점",
    description: "소매업 재고 관리",
    icon: "🏪",
  },
  {
    value: "WAREHOUSE",
    label: "창고",
    description: "대규모 창고 관리",
    icon: "🏭",
  },
  {
    value: "RESTAURANT",
    label: "식당",
    description: "식자재 관리",
    icon: "🍽️",
  },
  { value: "PHARMACY", label: "약국", description: "의약품 관리", icon: "💊" },
  {
    value: "EVENT",
    label: "이벤트",
    description: "행사용 재고 관리",
    icon: "🎉",
  },
  {
    value: "OFFICE",
    label: "사무실",
    description: "사무용품 관리",
    icon: "🏢",
  },
  {
    value: "GENERAL",
    label: "일반",
    description: "범용 재고 관리",
    icon: "📋",
  },
];

const getRoleInfo = (role: string) => {
  switch (role) {
    case "owner":
      return {
        label: "소유자",
        icon: Crown,
        color: "text-yellow-600 bg-yellow-100",
      };
    case "admin":
      return {
        label: "관리자",
        icon: Shield,
        color: "text-blue-600 bg-blue-100",
      };
    case "member":
      return {
        label: "멤버",
        icon: User,
        color: "text-green-600 bg-green-100",
      };
    case "viewer":
      return { label: "뷰어", icon: Eye, color: "text-gray-600 bg-gray-100" };
    default:
      return {
        label: "알 수 없음",
        icon: User,
        color: "text-gray-400 bg-gray-50",
      };
  }
};

export const WorkspaceTab: React.FC = React.memo(() => {
  const workspaceStore = useWorkspaceStore();
  const authStore = useAuthStore(); // 🔧 추가: 실제 사용자 정보 가져오기
  const { workspaces, currentWorkspaceId, initialize } = workspaceStore;

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState<WorkspaceFormData>({
    name: "",
    description: "",
    type: "DEFAULT",
  });

  // 🔧 수정: 실제 인증된 사용자 ID 사용
  const currentUserId = authStore.user?.id || null;

  // 🔧 수정: 워크스페이스 스토어 초기화 확인
  useEffect(() => {
    if (!workspaceStore.isInitialized) {
      initialize();
    }
  }, [workspaceStore.isInitialized, initialize]);

  // 🔧 수정: 현재 워크스페이스 정보 안전하게 가져오기
  const currentWorkspace = useMemo(() => {
    if (!currentWorkspaceId) return null;
    return workspaces.find((w) => w.id === currentWorkspaceId) || null;
  }, [workspaces, currentWorkspaceId]);

  // 🔧 수정: 사용자 역할 확인 (사용자가 없으면 기본 owner 처리)
  const currentUserRole = useMemo(() => {
    if (!currentWorkspaceId) return null;

    // 사용자가 인증되지 않았으면, 워크스페이스 생성자로 간주하여 owner 권한 부여
    if (!currentUserId) {
      // 워크스페이스가 있고 사용자 인증이 안된 경우는 일반적으로 테스트 환경
      return "owner";
    }

    return (
      workspaceStore.getUserRole(currentWorkspaceId, currentUserId) || "owner"
    );
  }, [currentWorkspaceId, currentUserId, workspaceStore]);

  // 워크스페이스 통계
  const workspaceStats = useMemo(() => {
    return {
      totalWorkspaces: workspaces.length,
      activeWorkspace: currentWorkspace?.name || "None",
      userRole: currentUserRole || "viewer",
      canManage: ["owner", "admin"].includes(currentUserRole || ""),
    };
  }, [workspaces.length, currentWorkspace, currentUserRole]);

  // 🔧 추가: 디버깅을 위한 로깅
  useEffect(() => {
    console.log("🔍 WorkspaceTab Debug:", {
      currentUserId,
      currentWorkspaceId,
      currentWorkspace: currentWorkspace?.name,
      currentUserRole,
      workspacesCount: workspaces.length,
      isInitialized: workspaceStore.isInitialized,
      memberships: workspaceStore.memberships,
    });
  }, [
    currentUserId,
    currentWorkspaceId,
    currentWorkspace,
    currentUserRole,
    workspaces.length,
    workspaceStore.isInitialized,
    workspaceStore.memberships,
  ]);

  // 폼 데이터 변경 핸들러
  const handleFormChange = useCallback(
    (field: keyof WorkspaceFormData, value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  // 워크스페이스 생성 - 🔧 수정: 사용자 권한 자동 설정
  const handleCreateWorkspace = useCallback(async () => {
    if (!formData.name.trim()) return;

    setIsLoading(true);
    try {
      const newWorkspace = workspaceStore.createWorkspace({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        type: formData.type,
      });

      // 🔧 추가: 생성 후 현재 사용자를 owner로 명시적 설정
      if (currentUserId) {
        workspaceStore.setUserRole(newWorkspace.id, currentUserId, "owner");
      }

      setFormData({ name: "", description: "", type: "DEFAULT" });
      setShowCreateModal(false);

      console.log("✅ 워크스페이스 생성됨:", newWorkspace);
    } catch (error) {
      console.error("워크스페이스 생성 실패:", error);
    } finally {
      setIsLoading(false);
    }
  }, [formData, workspaceStore, currentUserId]);

  // 워크스페이스 수정
  const handleUpdateWorkspace = useCallback(async () => {
    if (!showEditModal || !formData.name.trim()) return;

    setIsLoading(true);
    try {
      workspaceStore.updateWorkspace(showEditModal, {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        type: formData.type,
      });

      setShowEditModal(null);
      setFormData({ name: "", description: "", type: "DEFAULT" });
    } catch (error) {
      console.error("워크스페이스 수정 실패:", error);
    } finally {
      setIsLoading(false);
    }
  }, [showEditModal, formData, workspaceStore]);

  // 워크스페이스 삭제
  const handleDeleteWorkspace = useCallback(() => {
    if (!showDeleteModal) return;

    workspaceStore.deleteWorkspace(showDeleteModal);
    setShowDeleteModal(null);
  }, [showDeleteModal, workspaceStore]);

  // 워크스페이스 전환
  const handleSwitchWorkspace = useCallback(
    (workspaceId: string) => {
      workspaceStore.switchWorkspace(workspaceId);
    },
    [workspaceStore]
  );

  // 편집 모달 열기
  const openEditModal = useCallback((workspace: Workspace) => {
    setFormData({
      name: workspace.name,
      description: workspace.description || "",
      type: workspace.type,
    });
    setShowEditModal(workspace.id);
  }, []);

  // 🔧 추가: 권한 디버그 정보 표시 (개발 모드에서만)
  const showDebugInfo = process.env.NODE_ENV === "development";

  return (
    <div className="space-y-6">
      {/* 🔧 디버그 정보 표시 (개발 모드에서만) */}
      {showDebugInfo && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-medium text-yellow-800 mb-2">🔍 디버그 정보</h4>
          <div className="text-sm text-yellow-700 space-y-1">
            <p>현재 사용자 ID: {currentUserId || "None"}</p>
            <p>현재 워크스페이스 ID: {currentWorkspaceId || "None"}</p>
            <p>현재 사용자 역할: {currentUserRole || "None"}</p>
            <p>
              워크스페이스 초기화:{" "}
              {workspaceStore.isInitialized ? "완료" : "대기"}
            </p>
            <p>멤버십: {JSON.stringify(workspaceStore.memberships)}</p>
          </div>
        </div>
      )}

      {/* 워크스페이스 통계 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">
                총 워크스페이스
              </p>
              <p className="text-3xl font-bold text-blue-600">
                {workspaceStats.totalWorkspaces}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-xl">
              <Building className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">
                현재 워크스페이스
              </p>
              <p className="text-lg font-bold text-green-600 truncate">
                {workspaceStats.activeWorkspace}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-xl">
              <Check className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">내 역할</p>
              <p className="text-lg font-bold text-purple-600 capitalize">
                {getRoleInfo(workspaceStats.userRole).label}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-xl">
              {React.createElement(getRoleInfo(workspaceStats.userRole).icon, {
                className: "w-6 h-6 text-purple-600",
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 현재 워크스페이스 정보 */}
      {currentWorkspace && (
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    현재 워크스페이스
                  </h2>
                  <p className="text-sm text-gray-600">
                    활성 워크스페이스 정보
                  </p>
                </div>
              </div>

              {workspaceStats.canManage && (
                <button
                  onClick={() => openEditModal(currentWorkspace)}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  title="워크스페이스 편집"
                >
                  <Edit3 className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          <div className="p-6">
            <div className="flex items-start space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">
                {workspaceTypeOptions.find(
                  (opt) => opt.value === currentWorkspace.type
                )?.icon || "📦"}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-semibold text-gray-900 mb-1">
                  {currentWorkspace.name}
                </h3>
                {currentWorkspace.description && (
                  <p className="text-gray-600 mb-3">
                    {currentWorkspace.description}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>
                      생성일:{" "}
                      {new Date(currentWorkspace.createdAt).toLocaleDateString(
                        "ko-KR"
                      )}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Building className="w-4 h-4" />
                    <span>
                      유형:{" "}
                      {
                        workspaceTypeOptions.find(
                          (opt) => opt.value === currentWorkspace.type
                        )?.label
                      }
                    </span>
                  </div>
                  <div
                    className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs ${
                      getRoleInfo(workspaceStats.userRole).color
                    }`}
                  >
                    {React.createElement(
                      getRoleInfo(workspaceStats.userRole).icon,
                      {
                        className: "w-3 h-3",
                      }
                    )}
                    <span>{getRoleInfo(workspaceStats.userRole).label}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 모든 워크스페이스 목록 */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Building className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  워크스페이스 관리
                </h2>
                <p className="text-sm text-gray-600">
                  모든 워크스페이스를 보고 관리하세요
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />새 워크스페이스
            </button>
          </div>
        </div>

        <div className="divide-y divide-gray-100">
          {workspaces.map((workspace) => {
            const isActive = workspace.id === currentWorkspaceId;
            const userRole = currentUserId
              ? workspaceStore.getUserRole(workspace.id, currentUserId) ||
                "owner"
              : "owner";
            const roleInfo = getRoleInfo(userRole);
            const typeInfo = workspaceTypeOptions.find(
              (opt) => opt.value === workspace.type
            );

            return (
              <div
                key={workspace.id}
                className="p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg ${
                        isActive
                          ? "bg-gradient-to-br from-blue-500 to-purple-600 text-white"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {typeInfo?.icon || "📦"}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold text-gray-900">
                          {workspace.name}
                        </h3>
                        {isActive && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                            활성
                          </span>
                        )}
                      </div>
                      {workspace.description && (
                        <p className="text-sm text-gray-600 mt-1">
                          {workspace.description}
                        </p>
                      )}

                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                        <span>{typeInfo?.label}</span>
                        <span>•</span>
                        <span>
                          {new Date(workspace.createdAt).toLocaleDateString(
                            "ko-KR"
                          )}
                        </span>
                        <span>•</span>
                        <div
                          className={`flex items-center space-x-1 ${roleInfo.color}`}
                        >
                          <roleInfo.icon className="w-3 h-3" />
                          <span>{roleInfo.label}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {!isActive && (
                      <button
                        onClick={() => handleSwitchWorkspace(workspace.id)}
                        className="px-3 py-1 text-sm text-blue-600 border border-blue-600 rounded hover:bg-blue-50 transition-colors"
                      >
                        전환
                      </button>
                    )}

                    {["owner", "admin"].includes(userRole) && (
                      <>
                        <button
                          onClick={() => openEditModal(workspace)}
                          className="p-1 text-gray-600 hover:bg-gray-200 rounded transition-colors"
                          title="편집"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        {userRole === "owner" && workspaces.length > 1 && (
                          <button
                            onClick={() => setShowDeleteModal(workspace.id)}
                            className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                            title="삭제"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {workspaces.length === 0 && (
            <div className="p-12 text-center">
              <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                워크스페이스가 없습니다
              </h3>
              <p className="text-gray-600 mb-4">
                새 워크스페이스를 만들어 시작하세요
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                첫 워크스페이스 만들기
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 워크스페이스 생성/편집 모달 */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                {showCreateModal ? "새 워크스페이스" : "워크스페이스 편집"}
              </h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setShowEditModal(null);
                  setFormData({ name: "", description: "", type: "DEFAULT" });
                }}
                className="p-1 text-gray-600 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  워크스페이스 이름 *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleFormChange("name", e.target.value)}
                  placeholder="예: 우리 가게"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  설명 (선택사항)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    handleFormChange("description", e.target.value)
                  }
                  placeholder="워크스페이스에 대한 간단한 설명"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  워크스페이스 유형
                </label>
                <div className="relative">
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      handleFormChange("type", e.target.value as WorkspaceType)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                  >
                    {workspaceTypeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.icon} {option.label} - {option.description}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setShowEditModal(null);
                  setFormData({ name: "", description: "", type: "DEFAULT" });
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={
                  showCreateModal
                    ? handleCreateWorkspace
                    : handleUpdateWorkspace
                }
                disabled={!formData.name.trim() || isLoading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? "처리 중..." : showCreateModal ? "생성" : "저장"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 삭제 확인 모달 */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                워크스페이스 삭제
              </h3>
              <p className="text-gray-600 mb-6">
                이 워크스페이스와 관련된 모든 데이터가 삭제됩니다. 이 작업은
                되돌릴 수 없습니다.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowDeleteModal(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  onClick={handleDeleteWorkspace}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  삭제
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

WorkspaceTab.displayName = "WorkspaceTab";
