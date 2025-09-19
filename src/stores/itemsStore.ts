// src/stores/itemsStore.ts
import { create } from "zustand";
import type { StateCreator } from "zustand";
import type { Item as DomainItem } from "../types/domain";
import { nsPersist, makeNsName } from "./persistNamespace";
import { useWorkspaceStore } from "./workspaceStore_";

export type Item = DomainItem & {
  id: string;
  name: string;
  sku?: string;
  barcode?: string;
  minStock?: number;
  defaultPrice?: number;
  createdAt: string;
};

type State = {
  items: Record<string, Item>;
  query: string;
  lowStockThreshold: number;
  get visibleItems(): Item[];
};

type Actions = {
  setQuery: (q: string) => void;
  setLowStockThreshold: (n: number) => void;

  bulk: (rows: DomainItem[]) => void;
  upsert: (row: DomainItem) => void;

  addItem: (
    input: Omit<Item, "id" | "createdAt"> & { id?: string; createdAt?: string }
  ) => Item;
  updateItem: (id: string, patch: Partial<Item>) => void;
  removeItem: (id: string) => Item | undefined;

  hasSku: (sku: string, excludeId?: string) => boolean;
};

export type Store = State & Actions;

const nowISO = () => new Date().toISOString();
const genId = () =>
  `itm_${Math.random().toString(36).slice(2, 8)}_${Date.now()}`;

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 24);

// Domain -> 내부 표준 정규화
const normalize = (r: DomainItem): Item => {
  const id = (r as any).id ?? genId();
  return {
    id,
    name: (r as any).name?.trim() ?? "",
    sku: (r as any).sku?.trim() || undefined,
    barcode: (r as any).barcode?.trim() || undefined,
    minStock: (r as any).minStock ?? 0,
    defaultPrice: (r as any).defaultPrice,
    createdAt: (r as any).createdAt
      ? new Date((r as any).createdAt as any).toISOString()
      : nowISO(),
  };
};

// 상태/액션을 명시적으로 고정
const base: StateCreator<Store, [], []> = (set, get) => ({
  items: {},
  query: "",
  lowStockThreshold: 5,

  get visibleItems() {
    const { items, query } = get();
    const list = Object.values(items);
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((it) => {
      const name = it.name?.toLowerCase() ?? "";
      const sku = it.sku?.toLowerCase() ?? "";
      const barcode = it.barcode?.toLowerCase() ?? "";
      return name.includes(q) || sku.includes(q) || barcode.includes(q);
    });
  },

  setQuery: (q) => set({ query: q }),
  setLowStockThreshold: (n) => set({ lowStockThreshold: n }),

  bulk: (rows) =>
    set(() => ({
      items: rows.reduce<Record<string, Item>>((acc, r) => {
        const it = normalize(r);
        acc[it.id] = it;
        return acc;
      }, {}),
    })),

  upsert: (row) =>
    set((s) => {
      const it = normalize(row);
      return { items: { ...s.items, [it.id]: it } };
    }),

  addItem: (input) => {
    const id = input.id ?? genId();
    const createdAt = input.createdAt ?? nowISO();
    const name = input.name?.trim();
    if (!name) throw new Error("Name is required");

    // SKU 자동 생성(미입력 시)
    let sku = input.sku?.trim() || `${slugify(name)}-${id.slice(4, 8)}`;
    let suffix = 1;
    while (get().hasSku(sku)) {
      sku = `${slugify(name)}-${id.slice(4, 8)}-${suffix++}`;
    }

    const item: Item = {
      id,
      name,
      sku,
      barcode: input.barcode?.trim() || undefined,
      minStock: input.minStock ?? 0,
      defaultPrice: input.defaultPrice,
      createdAt,
    };
    set((s) => ({ items: { ...s.items, [id]: item } }));
    return item;
  },

  updateItem: (id, patch) =>
    set((s) => {
      const cur = s.items[id];
      if (!cur) return {};
      const next: Item = {
        ...cur,
        ...patch,
        name: (patch.name ?? cur.name).trim(),
        sku: patch.sku !== undefined ? patch.sku?.trim() || undefined : cur.sku,
        barcode:
          patch.barcode !== undefined
            ? patch.barcode?.trim() || undefined
            : cur.barcode,
        minStock: patch.minStock ?? cur.minStock,
        defaultPrice: (patch as any).defaultPrice ?? cur.defaultPrice,
      };
      return { items: { ...s.items, [id]: next } };
    }),

  removeItem: (id) => {
    const cur = get().items[id];
    if (!cur) return undefined;
    set((s) => {
      const next = { ...s.items };
      delete next[id];
      return { items: next };
    });
    return cur;
  },

  hasSku: (sku, excludeId) => {
    if (!sku) return false;
    const sk = sku.trim().toLowerCase();
    const { items } = get();
    return Object.values(items).some(
      (it) => it.sku?.trim().toLowerCase() === sk && it.id !== excludeId
    );
  },
});

// nsPersist의 반환 타입을 Store에 맞게 고정(좁은 캐스팅으로 partialize 서명 충돌 해소)
type PersistHof<T> = (sc: StateCreator<T, [], []>) => StateCreator<T, [], []>;
const withNsPersist = (nsPersist as any)("items", {
  partialize: (s: Store) => ({ items: s.items } as Pick<Store, "items">),
}) as PersistHof<Store>;

// 최종 스토어
export const useItemsStore = create<Store>()(withNsPersist(base));

// 워크스페이스 전환 시 persist 키 회전
useWorkspaceStore.subscribe(() => {
  (
    useItemsStore as unknown as {
      persist?: { setOptions: (o: { name: string }) => void };
    }
  ).persist?.setOptions({ name: makeNsName("items") });
});
