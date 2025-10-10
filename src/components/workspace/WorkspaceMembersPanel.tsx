// src/components/workspace/WorkspaceMembersPanel.tsx

import React, { useMemo } from "react";
import {
  Crown,
  Shield,
  User,
  Eye,
  Trash2,
  Mail,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { useWorkspaceStore, type WorkspaceRole } from "@/stores/workspaceStore";
import { useInvitationStore } from "@/stores/invitationStore";

interface WorkspaceMembersPanelProps {
  workspaceId: string;
  currentUserId: string | null;
  userRole: WorkspaceRole | null;
}

const roleIcons: Record<WorkspaceRole, React.ComponentType<any>> = {
  owner: Crown,
  admin: Shield,
  member: User,
  viewer: Eye,
};

const roleLabels: Record<WorkspaceRole, string> = {
  owner: "소유자",
  admin: "관리자",
  member: "멤버",
  viewer: "뷰어",
};

const statusLabels: Record<
  string,
  { label: string; color: string; icon: React.ComponentType<any> }
> = {
  pending: {
    label: "대기중",
    color: "text-yellow-600 bg-yellow-50",
    icon: Clock,
  },
  accepted: {
    label: "수락됨",
    color: "text-green-600 bg-green-50",
    icon: CheckCircle,
  },
  rejected: { label: "거절됨", color: "text-red-600 bg-red-50", icon: XCircle },
  expired: {
    label: "만료됨",
    color: "text-gray-600 bg-gray-50",
    icon: XCircle,
  },
};

export const WorkspaceMembersPanel: React.FC<WorkspaceMembersPanelProps> = ({
  workspaceId,
  currentUserId,
  userRole,
}) => {
  const { getWorkspaceMembers, removeUserFromWorkspace } = useWorkspaceStore();
  const { getInvitationsByWorkspace, deleteInvitation } = useInvitationStore();

  const members = getWorkspaceMembers(workspaceId);
  // ✅ invitationStore 변경 감지를 위해 의존성 배열에 추가
  const invitationStore = useInvitationStore();
  const invitations = useMemo(
    () => getInvitationsByWorkspace(workspaceId),
    [getInvitationsByWorkspace, workspaceId, invitationStore.invitations]
  );

  const canRemove = userRole === "owner" || userRole === "admin";
  const totalCount =
    members.length +
    invitations.filter((inv) => inv.status === "pending").length;

  const handleRemoveMember = (userId: string, memberRole: WorkspaceRole) => {
    if (memberRole === "owner") {
      alert("소유자는 제거할 수 없습니다.");
      return;
    }

    if (userId === currentUserId) {
      if (!confirm("정말 이 워크스페이스에서 나가시겠습니까?")) {
        return;
      }
    } else {
      if (!confirm("이 멤버를 제거하시겠습니까?")) {
        return;
      }
    }

    removeUserFromWorkspace(workspaceId, userId);
  };

  const handleCancelInvitation = (
    invitationId: string,
    inviteeEmail: string
  ) => {
    if (!confirm(`${inviteeEmail}에게 보낸 초대를 취소하시겠습니까?`)) {
      return;
    }
    deleteInvitation(invitationId);
  };

  return (
    <div className="border-t border-gray-200 bg-gray-50 px-5 py-4">
      <h5 className="text-sm font-semibold text-gray-900 mb-3">
        멤버 및 초대 ({totalCount})
      </h5>

      <div className="space-y-3">
        {/* 활성 멤버 섹션 */}
        {members.length > 0 && (
          <div>
            <h6 className="text-xs font-semibold text-gray-500 uppercase mb-2 flex items-center gap-1.5">
              <User className="w-3 h-3" />
              활성 멤버 ({members.length})
            </h6>
            <div className="space-y-2">
              {members.map(({ userId, role }) => {
                const RoleIcon = roleIcons[role];
                const isCurrentUser = userId === currentUserId;
                const isOwner = role === "owner";

                return (
                  <div
                    key={userId}
                    className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                        {userId.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900 truncate">
                            {userId}
                          </span>
                          {isCurrentUser && (
                            <span className="text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                              나
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <RoleIcon className="w-3 h-3 text-gray-500" />
                          <span className="text-xs text-gray-600">
                            {roleLabels[role]}
                          </span>
                        </div>
                      </div>
                    </div>

                    {canRemove && !isOwner && (
                      <button
                        onClick={() => handleRemoveMember(userId, role)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="제거"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 초대 목록 섹션 */}
        {invitations.length > 0 && (
          <div>
            <h6 className="text-xs font-semibold text-gray-500 uppercase mb-2 flex items-center gap-1.5">
              <Mail className="w-3 h-3" />
              초대 목록 ({invitations.length})
            </h6>
            <div className="space-y-2">
              {invitations.map((invitation) => {
                const statusInfo = statusLabels[invitation.status];
                const StatusIcon = statusInfo.icon;
                const RoleIcon = roleIcons[invitation.role];
                const isPending = invitation.status === "pending";

                return (
                  <div
                    key={invitation.id}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      isPending
                        ? "bg-yellow-50 border-yellow-200"
                        : "bg-white border-gray-200"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                        {invitation.inviteeEmail.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-gray-900 truncate">
                            {invitation.inviteeEmail}
                          </span>
                          <span
                            className={`text-xs px-1.5 py-0.5 rounded flex items-center gap-1 ${statusInfo.color}`}
                          >
                            <StatusIcon className="w-3 h-3" />
                            {statusInfo.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <div className="flex items-center gap-1.5">
                            <RoleIcon className="w-3 h-3 text-gray-500" />
                            <span className="text-xs text-gray-600">
                              {roleLabels[invitation.role]}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500">•</span>
                          <span className="text-xs text-gray-500">
                            {new Date(invitation.createdAt).toLocaleDateString(
                              "ko-KR",
                              {
                                month: "short",
                                day: "numeric",
                              }
                            )}
                          </span>
                          {isPending && (
                            <>
                              <span className="text-xs text-gray-500">•</span>
                              <span className="text-xs text-gray-500">
                                만료:{" "}
                                {new Date(
                                  invitation.expiresAt
                                ).toLocaleDateString("ko-KR", {
                                  month: "short",
                                  day: "numeric",
                                })}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {canRemove && (
                      <button
                        onClick={() =>
                          handleCancelInvitation(
                            invitation.id,
                            invitation.inviteeEmail
                          )
                        }
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title={isPending ? "초대 취소" : "삭제"}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 빈 상태 */}
        {members.length === 0 && invitations.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Mail className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">멤버나 초대가 없습니다</p>
          </div>
        )}
      </div>
    </div>
  );
};
