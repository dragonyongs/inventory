export type UserRole = "viewer" | "staff" | "manager" | "admin";

export interface UserProfile {
  id: string; // 사용자 고유 ID
  name: string; // 담당자명
  email: string;
  avatarUrl?: string; // 프로필 이미지 (optional)
  initials?: string; // 이니셜 뱃지 (optional)
  role: UserRole; // 권한 구분
}
