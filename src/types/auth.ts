export type Role = "owner" | "editor" | "viewer";

export interface User {
  id: string;
  email?: string;
  name?: string;
}

export interface WorkspaceMember {
  userId: string;
  role: Role;
}

export interface Workspace {
  id: string;
  name: string;
  members: WorkspaceMember[]; // owner 포함
  createdAt: string;
  createdBy: string; // owner userId
}
