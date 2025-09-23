// src/utils/expiryUtils.ts (새 파일)
export const calculateDaysUntilExpiry = (expiryDate: string): number => {
  if (!expiryDate) return Infinity;

  const today = new Date();
  const expiry = new Date(expiryDate);
  const diffTime = expiry.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const getExpiryStatus = (
  expiryDate: string,
  warningDays: number = 30
) => {
  const daysLeft = calculateDaysUntilExpiry(expiryDate);

  if (daysLeft < 0)
    return { status: "expired", color: "red", message: "기한 만료" };
  if (daysLeft <= 3)
    return { status: "critical", color: "red", message: "긴급" };
  if (daysLeft <= 7)
    return { status: "warning", color: "orange", message: "주의" };
  if (daysLeft <= warningDays)
    return { status: "caution", color: "yellow", message: "임박" };
  return { status: "safe", color: "green", message: "안전" };
};
