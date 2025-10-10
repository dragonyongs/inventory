// src/stores/invitationStore.ts

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { WorkspaceRole } from "./workspaceStore";

export interface WorkspaceInvitation {
  id: string;
  workspaceId: string;
  workspaceName: string;
  inviterEmail: string;
  inviterName: string;
  inviteeEmail: string;
  role: WorkspaceRole;
  status: "pending" | "accepted" | "rejected" | "expired";
  createdAt: string;
  expiresAt: string;
}

interface InvitationState {
  invitations: Record<string, WorkspaceInvitation>;
  pendingInvitations: string[];
}

interface InvitationActions {
  createInvitation: (data: {
    workspaceId: string;
    workspaceName: string;
    inviterEmail: string;
    inviterName: string;
    inviteeEmail: string;
    role: WorkspaceRole;
  }) => WorkspaceInvitation;

  // ✅ 추가: 단일 초대 조회
  getInvitation: (invitationId: string) => WorkspaceInvitation | undefined;

  acceptInvitation: (invitationId: string, userId: string) => void;
  rejectInvitation: (invitationId: string) => void;
  getPendingInvitations: (userEmail: string) => WorkspaceInvitation[];
  getInvitationsByWorkspace: (workspaceId: string) => WorkspaceInvitation[];
  deleteInvitation: (invitationId: string) => void;
}

type InvitationStore = InvitationState & InvitationActions;

function newId() {
  return Math.random().toString(36).slice(2, 10);
}

function nowIso() {
  return new Date().toISOString();
}

function getExpiryDate() {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return date.toISOString();
}

export const useInvitationStore = create<InvitationStore>()(
  persist(
    (set, get) => ({
      invitations: {},
      pendingInvitations: [],

      createInvitation: (data) => {
        const invitation: WorkspaceInvitation = {
          id: newId(),
          workspaceId: data.workspaceId,
          workspaceName: data.workspaceName,
          inviterEmail: data.inviterEmail,
          inviterName: data.inviterName,
          inviteeEmail: data.inviteeEmail,
          role: data.role,
          status: "pending",
          createdAt: nowIso(),
          expiresAt: getExpiryDate(),
        };

        set((s) => ({
          invitations: {
            ...s.invitations,
            [invitation.id]: invitation,
          },
          pendingInvitations: [...s.pendingInvitations, invitation.id],
        }));

        console.log("📨 초대 생성:", invitation);
        return invitation;
      },

      // ✅ 추가: 단일 초대 조회 함수
      getInvitation: (invitationId) => {
        return get().invitations[invitationId];
      },

      acceptInvitation: (invitationId, _userId) => {
        const invitation = get().invitations[invitationId];
        if (!invitation) return;

        set((s) => ({
          invitations: {
            ...s.invitations,
            [invitationId]: {
              ...invitation,
              status: "accepted",
            },
          },
          pendingInvitations: s.pendingInvitations.filter(
            (id) => id !== invitationId
          ),
        }));

        console.log("✅ 초대 수락:", invitationId);
      },

      rejectInvitation: (invitationId) => {
        const invitation = get().invitations[invitationId];
        if (!invitation) return;

        set((s) => ({
          invitations: {
            ...s.invitations,
            [invitationId]: {
              ...invitation,
              status: "rejected",
            },
          },
          pendingInvitations: s.pendingInvitations.filter(
            (id) => id !== invitationId
          ),
        }));

        console.log("❌ 초대 거절:", invitationId);
      },

      getPendingInvitations: (userEmail) => {
        const all = get().invitations;
        return Object.values(all).filter(
          (inv) =>
            inv.inviteeEmail.toLowerCase() === userEmail.toLowerCase() &&
            inv.status === "pending" &&
            new Date(inv.expiresAt) > new Date()
        );
      },

      getInvitationsByWorkspace: (workspaceId) => {
        const all = get().invitations;
        return Object.values(all).filter(
          (inv) => inv.workspaceId === workspaceId
        );
      },

      deleteInvitation: (invitationId) => {
        set((s) => {
          const updated = { ...s.invitations };
          delete updated[invitationId];
          return {
            invitations: updated,
            pendingInvitations: s.pendingInvitations.filter(
              (id) => id !== invitationId
            ),
          };
        });
      },
    }),
    {
      name: "invitation-storage",
      version: 1,
    }
  )
);
