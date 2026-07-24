import { useSyncExternalStore } from "react";
import type { MarketplaceName } from "@/services/marketplaceAccountService";

/**
 * Store untuk menyimpan mapping ERP SKU ↔ Marketplace SKU.
 *
 * Struktur ini disengaja stabil supaya nanti bisa dipetakan 1:1 ke tabel
 * database / payload Shopee Open API tanpa mengubah UI.
 */
export interface MappingRecord {
  id: string;
  erpSku: string;
  marketplace: MarketplaceName;
  shopId?: number;
  shopName?: string;
  productId?: string;
  marketplaceSkuId?: string;
  marketplaceSku: string;
  variation?: string;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = "maqilerp-marketplace-mappings";

function load(): MappingRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as MappingRecord[]) : [];
  } catch {
    return [];
  }
}

function save(items: MappingRecord[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore
  }
}

let state: MappingRecord[] = load();
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};
const getSnapshot = () => state;
const commit = (next: MappingRecord[]) => {
  state = next;
  save(state);
  emit();
};

function makeId() {
  return `map_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export const mappingStore = {
  getAll(): MappingRecord[] {
    return state;
  },
  getByErpSku(erpSku: string): MappingRecord[] {
    return state.filter((m) => m.erpSku === erpSku);
  },
  add(record: Omit<MappingRecord, "id" | "createdAt" | "updatedAt">) {
    const now = new Date().toISOString();
    const rec: MappingRecord = {
      ...record,
      id: makeId(),
      createdAt: now,
      updatedAt: now,
    };
    commit([...state, rec]);
    return rec;
  },
  addMany(records: Omit<MappingRecord, "id" | "createdAt" | "updatedAt">[]) {
    const now = new Date().toISOString();
    const keyOf = (r: Pick<MappingRecord, "erpSku" | "marketplace" | "shopId" | "productId" | "marketplaceSkuId" | "marketplaceSku">) =>
      `${r.erpSku}|${r.marketplace}|${r.shopId ?? ""}|${r.productId ?? ""}|${r.marketplaceSkuId ?? r.marketplaceSku}`;
    const existing = new Set(state.map(keyOf));
    const recs: MappingRecord[] = [];
    records.forEach((r) => {
      const k = keyOf(r);
      if (existing.has(k)) return;
      existing.add(k);
      recs.push({ ...r, id: makeId(), createdAt: now, updatedAt: now });
    });
    if (recs.length === 0) return recs;
    commit([...state, ...recs]);
    return recs;
  },
  removeById(id: string) {
    commit(state.filter((m) => m.id !== id));
  },
  removeByErpSku(erpSku: string) {
    commit(state.filter((m) => m.erpSku !== erpSku));
  },
  /**
   * Sinkronkan mapping untuk kombinasi (erpSku, marketplace) tertentu:
   * hapus mapping lama yang tidak lagi ada di `records`, tambah yang baru.
   * Dipakai halaman "Hubungkan" agar penghapusan item di panel kanan
   * benar-benar dihapus dari store — bukan hanya di-add saja.
   */
  replaceForErpSkuAndMarketplace(
    erpSku: string,
    marketplace: MappingRecord["marketplace"],
    records: Omit<MappingRecord, "id" | "createdAt" | "updatedAt">[],
  ) {
    const now = new Date().toISOString();
    const keyOf = (r: Pick<MappingRecord, "shopId" | "productId" | "marketplaceSkuId" | "marketplaceSku">) =>
      `${r.shopId ?? ""}|${r.productId ?? ""}|${r.marketplaceSkuId ?? r.marketplaceSku}`;
    const kept = state.filter(
      (m) => !(m.erpSku === erpSku && m.marketplace === marketplace),
    );
    const existingSame = state.filter(
      (m) => m.erpSku === erpSku && m.marketplace === marketplace,
    );
    const existingById = new Map(existingSame.map((m) => [keyOf(m), m]));
    const next: MappingRecord[] = [...kept];
    records.forEach((r) => {
      const prev = existingById.get(keyOf(r));
      if (prev) {
        next.push({ ...prev, ...r, updatedAt: now });
      } else {
        next.push({ ...r, id: makeId(), createdAt: now, updatedAt: now });
      }
    });
    commit(next);
  },
  update(id: string, patch: Partial<MappingRecord>) {
    commit(
      state.map((m) =>
        m.id === id ? { ...m, ...patch, updatedAt: new Date().toISOString() } : m,
      ),
    );
  },
};

export function useMappings(): MappingRecord[] {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
