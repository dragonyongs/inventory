// src/hooks/useExpiryNotifications.ts (새 파일)
import { useMemo } from "react";
import { useItemList } from "../stores/selectors";
import { useSettingsStore } from "../stores/settingsStore";
import { calculateDaysUntilExpiry } from "../utils/expiryUtils";

export const useExpiryNotifications = () => {
  const items = useItemList();
  const expiringDays = useSettingsStore((state) => state.expiringDays);

  const expiryAlerts = useMemo(() => {
    return items
      .filter((item) => item.expiryDate)
      .map((item) => ({
        ...item,
        daysLeft: calculateDaysUntilExpiry(item.expiryDate!),
      }))
      .filter((item) => item.daysLeft <= expiringDays)
      .sort((a, b) => a.daysLeft - b.daysLeft);
  }, [items, expiringDays]);

  return {
    expiryAlerts,
    criticalCount: expiryAlerts.filter((item) => item.daysLeft <= 3).length,
    warningCount: expiryAlerts.filter((item) => item.daysLeft <= 7).length,
  };
};
