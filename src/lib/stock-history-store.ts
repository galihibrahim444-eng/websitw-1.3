import { useSyncExternalStore } from "react";

/**
 * Stock History — audit trail terpusat untuk seluruh pergerakan stok.
 *
 * Prinsip:
 * - Sumber data tunggal (single source of truth) untuk halaman Riwayat Stok.
 * - Hanya WRITE dari modul yang mengubah stok (Penambahan, Pengurangan,
 *   Stock Opname, Pesanan, Retur, Mutasi Gudang, Sinkronisasi Marketplace).
 * - Halaman Riwayat Stok hanya READ, tidak pernah menulis.
 * - Riwayat TIDAK dipakai untuk menghitung stok. Stok saat ini tetap
 *   berasal dari productStore (Master Produk).
 * - Persistensi lokal via localStorage; siap diganti REST API/DB tanpa
 *   mengubah kontrak publik (record/query/subscribe/useStockHistory).
 */

export const StockTransactionType = {
  ADD_STOCK: "ADD_STOCK",
  REMOVE_STOCK: "REMOVE_STOCK",
  STOCK_OPNAME: "STOCK_OPNAME",
  ORDER: "ORDER",
  ORDER_CANCEL: "ORDER_CANCEL",
  RETURN_IN: "RETURN_IN",
  RETURN_OUT: "RETURN_OUT",
  TRANSFER: "TRANSFER",
  MARKETPLACE_SYNC: "MARKETPLACE_SYNC",
} as const;

export type StockTransactionType =
  (typeof StockTransactionType)[keyof typeof StockTransactionType];

export const STOCK_TRANSACTION_LABEL: Record<StockTransactionType, string> = {
  ADD_STOCK: "Penambahan Stok",
  REMOVE_STOCK: "Pengurangan Stok",
  STOCK_OPNAME: "Stock Opname",
  ORDER: "Pesanan",
  ORDER_CANCEL: "Pembatalan Pesanan",
  RETURN_IN: "Retur Masuk",
  RETURN_OUT: "Retur Keluar",
  TRANSFER: "Mutasi Gudang",
  MARKETPLACE_SYNC: "Sinkronisasi Marketplace",
};

export interface StockHistoryEntry {
  id: string;
  createdAt: number;
  transactionType: StockTransactionType;
  referenceNo: string;
  productId: string;
  variantIndex: number | null;
  sku: string;
  productName: string;
  variation: string;
  warehouse: string;
  beforeStock: number;
  /** Signed delta: positif = penambahan, negatif = pengurangan, 0 = tidak berubah. */
  changeQty: number;
  afterStock: number;
  note?: string;
  user?: string;
}

export type StockHistoryInput = Omit<StockHistoryEntry, "id" | "createdAt"> & {
  createdAt?: number;
};

const STORAGE_KEY = "maqilerp-stock-history";

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `hist-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

// ---- Legacy migration ---------------------------------------------------
// Skema lama: { id, timestamp, type: "penambahan"|"pengurangan"|"stock_opname",
//   qty, stokSebelum, stokSesudah, namaProduk, variasi, catatan, ... }
// Dipertahankan agar data lokal user tidak hilang saat upgrade skema.
type LegacyEntry = {
  id?: string;
  timestamp?: number;
  type?: "penambahan" | "pengurangan" | "stock_opname";
  productId?: string;
  variantIndex?: number | null;
  sku?: string;
  namaProduk?: string;
  variasi?: string;
  qty?: number;
  stokSebelum?: number;
  stokSesudah?: number;
  catatan?: string;
  user?: string;
};

function migrate(raw: unknown): StockHistoryEntry[] {
  if (!Array.isArray(raw)) return [];
  const out: StockHistoryEntry[] = [];
  for (const r of raw as Array<Partial<StockHistoryEntry> & LegacyEntry>) {
    if (!r || typeof r !== "object") continue;
    if (r.transactionType && typeof r.createdAt === "number") {
      out.push(r as StockHistoryEntry);
      continue;
    }
    const legacyType = r.type;
    const tt: StockTransactionType =
      legacyType === "penambahan"
        ? "ADD_STOCK"
        : legacyType === "pengurangan"
          ? "REMOVE_STOCK"
          : legacyType === "stock_opname"
            ? "STOCK_OPNAME"
            : "ADD_STOCK";
    const before = r.stokSebelum ?? 0;
    const after = r.stokSesudah ?? 0;
    out.push({
      id: r.id ?? uid(),
      createdAt: r.timestamp ?? Date.now(),
      transactionType: tt,
      referenceNo: "-",
      productId: r.productId ?? "",
      variantIndex: r.variantIndex ?? null,
      sku: r.sku ?? "-",
      productName: r.namaProduk ?? "-",
      variation: r.variasi ?? "-",
      warehouse: "Gudang Utama",
      beforeStock: before,
      changeQty: after - before,
      afterStock: after,
      note: r.catatan,
      user: r.user,
    });
  }
  return out;
}

function load(): StockHistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return migrate(JSON.parse(raw));
  } catch {
    return [];
  }
}

function save(items: StockHistoryEntry[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    /* abaikan quota */
  }
}

let state: StockHistoryEntry[] = load();
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};
const getSnapshot = () => state;

let refCounter = 0;
function nextReferenceNo(tt: StockTransactionType, ts: number): string {
  const prefix =
    tt === "ADD_STOCK"
      ? "ADD"
      : tt === "REMOVE_STOCK"
        ? "OUT"
        : tt === "STOCK_OPNAME"
          ? "SO"
          : tt === "ORDER"
            ? "ORD"
            : tt === "ORDER_CANCEL"
              ? "CNL"
              : tt === "RETURN_IN"
                ? "RTI"
                : tt === "RETURN_OUT"
                  ? "RTO"
                  : tt === "TRANSFER"
                    ? "TRF"
                    : "SYNC";
  const d = new Date(ts);
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  refCounter = (refCounter + 1) % 10000;
  const seq = String(refCounter).padStart(4, "0");
  return `${prefix}-${ymd}-${seq}`;
}

export const stockHistoryStore = {
  getAll(): StockHistoryEntry[] {
    return state;
  },
  /**
   * Catat satu atau banyak entri riwayat. Entri dalam satu batch berbagi
   * referenceNo yang sama (dianggap satu transaksi).
   */
  record(
    entries: StockHistoryInput | StockHistoryInput[],
    opts?: { referenceNo?: string },
  ) {
    const now = Date.now();
    const list = Array.isArray(entries) ? entries : [entries];
    if (list.length === 0) return;
    const ref =
      opts?.referenceNo ?? nextReferenceNo(list[0].transactionType, now);
    const mapped: StockHistoryEntry[] = list.map((e) => ({
      ...e,
      warehouse: e.warehouse || "Gudang Utama",
      referenceNo: e.referenceNo || ref,
      id: uid(),
      createdAt: e.createdAt ?? now,
    }));

    state = [...mapped, ...state];
    save(state);
    emit();
  },
  subscribe,
};

export function useStockHistory(): StockHistoryEntry[] {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
