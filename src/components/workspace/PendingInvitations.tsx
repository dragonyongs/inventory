// src/components/workspace/PendingInvitations.tsx
import React from "react";
import { Check, X, Mail } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useInvitationStore } from "@/stores/invitationStore";
import { useWorkspaceStore } from "@/stores/workspaceStore";

export const PendingInvitations: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const { getPendingInvitations, acceptInvitation, rejectInvitation } =
    useInvitationStore();
  const { setUserRole, switchWorkspace } = useWorkspaceStore();

  if (!user) return null;

  const pendingInvites = getPendingInvitations(user.email);

  if (pendingInvites.length === 0) return null;

  const handleAccept = (invitationId: string) => {
    const invitation = pendingInvites.find((inv) => inv.id === invitationId);
    if (!invitation || !user) return;

    // 워크스페이스에 멤버로 추가
    setUserRole(invitation.workspaceId, user.id, invitation.role);
    acceptInvitation(invitationId, user.id);

    // 해당 워크스페이스로 전환
    switchWorkspace(invitation.workspaceId);

    alert(`"${invitation.workspaceName}" 워크스페이스에 참여했습니다!`);
  };

  const handleReject = (invitationId: string) => {
    if (confirm("정말로 이 초대를 거절하시겠습니까?")) {
      rejectInvitation(invitationId);
    }
  };

  return (
    <div className="mb-6 space-y-2">
      <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
        <Mail className="w-4 h-4" />
        받은 초대 ({pendingInvites.length})
      </h3>
      {pendingInvites.map((invitation) => (
        <div
          key={invitation.id}
          className="bg-yellow-50 border border-yellow-200 rounded-lg p-4"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="font-medium text-gray-900">
                {invitation.workspaceName}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {invitation.inviterName} ({invitation.inviterEmail})님이
                초대했습니다
              </p>
              <p className="text-xs text-gray-500 mt-1">
                권한: <span className="font-medium">{invitation.role}</span>
              </p>
            </div>
            <div className="flex gap-2 ml-4">
              <button
                onClick={() => handleAccept(invitation.id)}
                className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700
                  transition-colors"
                title="수락"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleReject(invitation.id)}
                className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700
                  transition-colors"
                title="거절"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
