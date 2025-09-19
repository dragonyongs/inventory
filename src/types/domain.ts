// src/types/domain.ts
export type MovementType = "IN" | "OUT" | "ADJUST" | "TRANSFER";

export interface Item {
  id: string;
  name: string;
  sku?: string;
  barcode?: string;
  category?: string;
  stock?: number; // optional로 변경
}

export interface Lot {
  id: string;
  itemId: string;
  qty: number;
  expiresAt?: string;
  batchNumber?: string;
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
