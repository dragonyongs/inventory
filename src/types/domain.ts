// src/types/domain.ts
export type MovementType = "IN" | "OUT" | "TRANSFER" | "ADJUST";

export interface Movement {
  id: string;
  type: MovementType;
  itemId: string;
  lotId?: string;
  qty: number;
  reason?: string;
  actor: string;
  createdAt: string;
}

export interface Item {
  id: string;
  name: string;
  sku?: string;
  barcode?: string;
  category?: string;
  stock?: number;
  minStock?: number;
  defaultPrice?: number;
  createdAt?: string;
}

export interface Lot {
  id: string;
  itemId: string;
  qty: number;
  expiresAt?: string;
  batchNumber?: string;
  receivedAt?: string;
}
