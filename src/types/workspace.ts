export type WorkspaceType =
  | "DEFAULT"
  | "RETAIL"
  | "WAREHOUSE"
  | "RESTAURANT"
  | "PHARMACY"
  | "EVENT"
  | "OFFICE"
  | "GENERAL";

export interface Workspace {
  id: string;
  name: string;
  description?: string;
  type: WorkspaceType;
  createdAt: string;
  updatedAt?: string;
  ownerId?: string;
}

export interface WorkspaceFormData {
  name: string;
  description?: string;
  type: WorkspaceType;
}
