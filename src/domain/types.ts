// src/domain/types.ts
export type ID = string;

export type User = {
  id: ID;
  email: string;
  name?: string;
};

export type Workspace = {
  id: ID;
  name: string;
  ownerId: ID;
};

export type WorkspaceMember = {
  workspace_id: ID;
  user_id: ID;
  role: "owner" | "editor" | "viewer";
};

export type Item = {
  id: ID;
  workspace_id: ID;
  sku: string;
  name: string;
};

export type Lot = {
  id: ID;
  workspace_id: ID;
  item_id: ID;
  expires_at?: string; // ISO
};

export type Movement = {
  id: ID;
  workspace_id: ID;
  item_id: ID;
  lot_id?: ID;
  type: "IN" | "OUT" | "TRANSFER";
  qty: number;
  actor_id: ID;
  reason?: string;
  created_at: string;
  from_ws_id?: ID;
  to_ws_id?: ID;
};
