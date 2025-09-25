// src/utils/generateId.ts
export function generateId(prefix?: string): string {
  const id =
    globalThis.crypto?.randomUUID?.() ??
    `${prefix || "id"}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  return id;
}
