// src/utils/applyMovement.ts
import type { Lot, MovementType } from "../types/domain";

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

export function applyMovementToLots(
  currentLots: Lot[],
  movement: Movement
): Lot[] {
  // 간단한 로직 - 실제로는 FEFO 등의 복잡한 로직이 필요
  if (movement.type === "IN" || movement.type === "ADJUST") {
    // 입고 시 새 로트 생성
    const newLot: Lot = {
      id: globalThis.crypto?.randomUUID?.() ?? `lot_${Date.now()}`,
      itemId: movement.itemId,
      qty: movement.qty,
      batchNumber: `BATCH_${Date.now()}`,
      receivedAt: movement.createdAt,
    };
    return [...currentLots, newLot];
  }

  // 출고 시 기존 로트에서 차감
  return currentLots.map((lot) => {
    if (
      lot.itemId === movement.itemId &&
      (movement.type === "OUT" || movement.type === "TRANSFER")
    ) {
      return {
        ...lot,
        qty: Math.max(0, lot.qty - movement.qty),
        receivedAt: lot.receivedAt || movement.createdAt,
      };
    }
    return lot;
  });
}
