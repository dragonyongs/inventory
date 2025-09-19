import { create } from "zustand";
import type { Workspace, Role } from "../types/auth";
import { useAuthStore } from "./authStore";

type State = {
  workspaces: Workspace[];
  currentId: string | null;
};
type Actions = {
  createWorkspace: (name: string) => Workspace;
  setCurrent: (id: string) => void;
  renameWorkspace: (id: string, name: string) => void;
  inviteMember: (id: string, userId: string, role: Role) => void;
  removeMember: (id: string, userId: string) => void; // owner는 제거 불가
  can: (id: string, action: "delete" | "edit" | "view") => boolean;
};

function ensureOwner(id: string) {
  const me = useAuthStore.getState().user?.id;
  const ws = useWorkspaceStore.getState().workspaces.find((w) => w.id === id);
  if (!me || !ws || ws.createdBy !== me) throw new Error("Owner only");
}

export const useWorkspaceStore = create<State & Actions>((set, get) => ({
  workspaces: [
    {
      id: "ws-1",
      name: "Home",
      createdAt: new Date().toISOString(),
      createdBy: useAuthStore.getState().user!.id,
      members: [{ userId: useAuthStore.getState().user!.id, role: "owner" }],
    },
  ],
  currentId: "ws-1",

  createWorkspace: (name) => {
    const me = useAuthStore.getState().user;
    if (!me) throw new Error("Sign in required");
    const ws: Workspace = {
      id: crypto.randomUUID(),
      name,
      createdAt: new Date().toISOString(),
      createdBy: me.id,
      members: [{ userId: me.id, role: "owner" }],
    };
    set((s) => ({ workspaces: [...s.workspaces, ws], currentId: ws.id }));
    return ws;
  },

  setCurrent: (id) => set({ currentId: id }),

  renameWorkspace: (id, name) => {
    ensureOwner(id);
    set((s) => ({
      workspaces: s.workspaces.map((w) => (w.id === id ? { ...w, name } : w)),
    }));
  },

  inviteMember: (id, userId, role) => {
    const me = useAuthStore.getState().user?.id;
    const ws = get().workspaces.find((w) => w.id === id);
    if (!me || !ws) throw new Error("Not found");
    const meRole = ws.members.find((m) => m.userId === me)?.role;
    if (meRole !== "owner" && meRole !== "editor")
      throw new Error("No permission");
    if (ws.members.some((m) => m.userId === userId)) return;
    set((s) => ({
      workspaces: s.workspaces.map((w) =>
        w.id === id ? { ...w, members: [...w.members, { userId, role }] } : w
      ),
    }));
  },

  removeMember: (id, userId) => {
    ensureOwner(id); // 생성자만 멤버 편집/삭제 가능
    set((s) => ({
      workspaces: s.workspaces.map((w) =>
        w.id === id
          ? {
              ...w,
              members: w.members.filter(
                (m) => m.userId !== userId && !(m.role === "owner")
              ),
            }
          : w
      ),
    }));
  },

  can: (id, action) => {
    const me = useAuthStore.getState().user?.id;
    const ws = get().workspaces.find((w) => w.id === id);
    if (!me || !ws) return false;
    const role = ws.members.find((m) => m.userId === me)?.role;
    if (!role) return false;
    if (action === "delete") return ws.createdBy === me; // 생성자만 삭제 [owner]
    if (action === "edit") return role === "owner" || role === "editor";
    return true;
  },
}));
