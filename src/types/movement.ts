// src/types/movement.ts
export type MovementType =
  | "INBOUND"
  | "OUTBOUND"
  | "USE"
  | "ADJUST"
  | "TRANSFER"
  | "DELETE"
  | "MODIFY"
  | "CREATE";

export interface Movement {
  id: string;
  itemId: string;
  quantity: number;
  beforeQty: number;
  afterQty: number;
  movementType: MovementType;
  reason?: string;
  createdAt: string;
  createdBy: string;
  warehouseId?: string;
  note?: string;
}
