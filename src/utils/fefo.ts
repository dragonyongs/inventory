import type { Lot } from "../types/domain";

export function orderLotsFefo(lots: Lot[]) {
  return [...lots]
    .filter((l) => l.qty > 0)
    .sort(
      (a, b) =>
        new Date(a.expiresAt ?? "9999").getTime() -
        new Date(b.expiresAt ?? "9999").getTime()
    );
}
