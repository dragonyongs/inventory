// src/components/workspace/InviteMemberModal.tsx

import React, { useState } from "react";
import { X, Mail, UserPlus, AlertCircle } from "lucide-react";
import { WorkspaceRole } from "@/stores/workspaceStore";
import { useInvitationStore } from "@/stores/invitationStore";
import { useAuthStore } from "@/stores/authStore";
import { sendInvitationEmail } from "@/services/emailService";

// ✅ UTF-8 안전 Base64 인코딩/디코딩 함수
function encodeBase64(str: string): string {
  return btoa(
    encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) => {
      return String.fromCharCode(parseInt(p1, 16));
    })
  );
}

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
  workspaceName: string;
  onInviteSuccess?: () => void;
}

export const InviteMemberModal: React.FC<InviteMemberModalProps> = ({
  isOpen,
  onClose,
  workspaceId,
  workspaceName,
  onInviteSuccess,
}) => {
  const user = useAuthStore((s) => s.user);
  const createInvitation = useInvitationStore((s) => s.createInvitation);
  const deleteInvitation = useInvitationStore((s) => s.deleteInvitation);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<WorkspaceRole>("member");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !user) return;

    setIsSubmitting(true);
    setError(null);

    let invitation = null;

    try {
      // 1. 초대 정보 생성
      invitation = createInvitation({
        workspaceId,
        workspaceName,
        inviterEmail: user.email,
        inviterName: user.name,
        inviteeEmail: email.trim(),
        role,
      });

      console.log("📋 초대 생성 완료:", invitation);

      // ✅ 2. UTF-8 안전 Base64 인코딩
      const inviteData = {
        wsId: workspaceId,
        wsName: workspaceName,
        role: role,
        inviter: user.name,
      };

      const encodedData = encodeBase64(JSON.stringify(inviteData));
      const invitationLink = `${window.location.origin}?invite=${encodedData}`;

      console.log("🔗 초대 링크:", invitationLink);

      // 3. 이메일 전송
      const emailResult = await sendInvitationEmail({
        to_email: email.trim(),
        to_name: email.split("@")[0],
        from_name: user.name,
        from_email: user.email,
        workspace_name: workspaceName,
        invitation_link: invitationLink,
        role: role,
      });

      if (emailResult.success) {
        alert(
          `✅ 초대 완료!\n\n${email}로 초대 이메일을 발송했습니다.\n사용자가 이메일의 링크를 클릭하면 자동으로 워크스페이스에 참여됩니다.`
        );

        setEmail("");
        setRole("member");

        if (onInviteSuccess) {
          onInviteSuccess();
        }

        setTimeout(() => onClose(), 500);
      } else {
        if (invitation) {
          deleteInvitation(invitation.id);
        }
        throw new Error(emailResult.error || "이메일 전송에 실패했습니다.");
      }
    } catch (err: any) {
      console.error("❌ 초대 실패:", err);

      if (invitation) {
        deleteInvitation(invitation.id);
      }

      setError(err.message || "초대 생성에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            멤버 초대
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            disabled={isSubmitting}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              이메일 주소 *
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg
                  focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="example@gmail.com"
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              권한 선택
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as WorkspaceRole)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg
                focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isSubmitting}
            >
              <option value="admin">관리자 - 거의 모든 권한</option>
              <option value="member">멤버 - 아이템 관리 가능</option>
              <option value="viewer">뷰어 - 조회만 가능</option>
            </select>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800 whitespace-pre-line">
                {error}
              </p>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              💡 초대 이메일에는 워크스페이스 참여 링크가 포함됩니다.
            </p>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg
                hover:bg-gray-50 transition-colors disabled:opacity-50"
              disabled={isSubmitting}
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !email.trim()}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg
                hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed
                transition-colors"
            >
              {isSubmitting ? "초대 중..." : "초대하기"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
