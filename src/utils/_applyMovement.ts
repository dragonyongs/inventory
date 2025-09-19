import type { Lot, Movement } from "../types/domain";
import { orderLotsFefo } from "./fefo";

export function applyMovementToLots(lots: Lot[], m: Movement): Lot[] {
  const byId = new Map(lots.map((l) => [l.id, { ...l }]));
  const nowIso = new Date().toISOString();

  if (m.type === "IN") {
    if (m.lotId) {
      const target = byId.get(m.lotId);
      if (target) {
        target.qty += m.qty;
      } else {
        byId.set(m.lotId, {
          id: m.lotId,
          itemId: m.itemId,
          qty: m.qty,
          receivedAt: nowIso,
        });
      }
    } else {
      const id = crypto.randomUUID();
      byId.set(id, {
        id,
        itemId: m.itemId,
        qty: m.qty,
        receivedAt: nowIso,
      });
    }
  } else if (m.type === "OUT") {
    let remain = m.qty;
    const ordered = orderLotsFefo(lots.filter((l) => l.itemId === m.itemId));
    for (const lot of ordered) {
      if (remain <= 0) break;
      const take = Math.min(lot.qty, remain);
      const updated = byId.get(lot.id)!;
      updated.qty -= take;
      remain -= take;
    }
    if (remain > 0) throw new Error("Insufficient stock");
  }
  return [...byId.values()];
}
