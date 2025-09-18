// src/types/domain.ts
export type MovementType = "IN" | "OUT" | "ADJUST" | "TRANSFER";

export interface Item {
  id: string;
  name: string;
  sku?: string;
  minStock?: number;
  barcode?: string;
}

export interface Lot {
  id: string;
  itemId: string;
  qty: number;
  unitCost?: number;
  receivedAt: string; // ISO
  expiresAt?: string; // ISO (FEFO 대비)
}

export interface Movement {
  id: string;
  type: MovementType;
  itemId: string;
  lotId?: string;
  qty: number;
  reason?: string;
  actor?: string;
  createdAt: string; // ISO
}
