import type { Movement, MovementType } from "./movement";
import type { UserProfile } from "./user";

export interface ActivityLog {
  id: string;
  type: MovementType | "MODIFY" | "CREATE"; // 작업 유형 아이콘 표시
  movement?: Movement; // 입출고 액션 연동
  user: UserProfile; // 작업자
  itemId: string;
  itemName: string;
  change: number; // 수량 증감
  beforeQty: number;
  afterQty: number;
  actionTime: string; // ISO 날짜+시간
  relativeTimeText?: string; // "2시간 전" 등
  absoluteTimeText?: string; // "10:42 AM" 등
  reason?: string; // 작업 사유
  location?: string; // 창고/지점명
  memo?: string; // 상세 메모 (optional)
}
