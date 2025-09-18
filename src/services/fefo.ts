// src/services/fefo.ts
type LotLike = { id: string; expires_at?: string | null };
export function pickFEFOLot(lots: LotLike[]) {
  const dated = lots
    .filter((l) => l.expires_at)
    .sort((a, b) => Date.parse(a.expires_at!) - Date.parse(b.expires_at!));
  return dated[0] ?? null;
}
