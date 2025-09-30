// src/utils/movementHelpers.ts
import { useAuthStore } from "@/stores/authStore";
import type { Movement, MovementType } from "@/stores/movementsStore";

export interface CreateMovementParams {
  type: MovementType;
  itemId: string;
  qty: number;
  reason?: string;
  itemSnapshot?: {
    name: string;
    sku?: string;
    category?: string;
  };
  isSharedAccess?: boolean;
  shareToken?: string;
}

/**
 * Movement 생성 시 자동으로 사용자 정보를 추가하는 헬퍼 함수
 */
export const createMovementWithUser = (
  params: CreateMovementParams
): Movement => {
  const user = useAuthStore.getState().user;

  const movementId =
    globalThis.crypto?.randomUUID?.() ?? `movement_${Date.now()}`;

  return {
    id: movementId,
    type: params.type,
    itemId: params.itemId,
    qty: params.qty,
    reason: params.reason,
    createdAt: new Date().toISOString(),
    itemSnapshot: params.itemSnapshot,
    isSharedAccess: params.isSharedAccess,
    shareToken: params.shareToken,
    // ✅ 사용자 정보 자동 추가
    userName: user?.name || user?.email?.split("@")[0] || undefined,
    userId: user?.id,
    userEmail: user?.email,
  };
};
