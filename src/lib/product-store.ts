import { useSyncExternalStore } from "react";
import type { ProductSavePayload } from "@/services/product/types";

// Sumber data tunggal untuk produk yang dibuat lewat halaman "Tambah Produk".
// Persistensi menggunakan localStorage sehingga data tidak hilang saat refresh.
// Layer ini dirancang agar mudah diganti dengan REST API / Shopee Open API:
// cukup mengganti implementasi loadProducts/saveProducts + CRUD di bawah,
// UI tidak perlu berubah.

export type StoredProductStatus = "draft" | "live" | "archive";

export interface StoredVariant {
  sku: string;
  harga: number;
  stok: number;
  gambar: string | null;
  status: boolean;
}

export interface StoredProduct {
  id: string;
  namaProduk: string;
  skuInduk: string;
  kategori: string;
  brand: string;
  fotoCover: string | null;
  harga: number;
  /**
   * Harga Modal / HPP (product-level). Berlaku untuk seluruh variasi.
   * Undefined untuk produk hasil sinkronisasi marketplace (Shopee tidak
   * mengirim modal). Hanya boleh diubah oleh user ERP; TIDAK boleh
   * ditimpa oleh proses sinkron marketplace.
   */
  hpp?: number;
  /**
   * Harga Jual default (product-level). Boleh diperbarui oleh sinkron
   * marketplace. Field `harga` (legacy) tetap dipertahankan sebagai
   * ringkasan/kompatibilitas mundur.
   */
  sellingPrice?: number;
  stok: number;
  /** Batas minimum stok. Produk dianggap "Stok Menipis" jika stok <= nilai ini. */
  minimumStock?: number;
  marketplace: string;
  status: StoredProductStatus;
  createdAt: number;
  updatedAt: number;
  variants: StoredVariant[];
  /**
   * Snapshot payload form untuk rehidrasi halaman "Tambah Produk" pada mode Edit.
   * Opsional agar backward-compatible dengan data lama di localStorage.
   */
  raw?: ProductSavePayload;
  /** Soft delete: status sebelum diarsipkan, untuk restore. */
  previousStatus?: StoredProductStatus;
  /** Soft delete: timestamp saat produk dipindahkan ke arsip. */
  deletedAt?: number;
}

/** Nilai default minimum stok bila produk belum memiliki `minimumStock`. */
export const DEFAULT_MINIMUM_STOCK = 5;

/**
 * Stok menipis: ada variasi (atau produk tanpa variasi) yang stoknya
 * di atas 0 tetapi <= minimumStock. Variasi habis (0) tidak dihitung
 * sebagai menipis — itu masuk kategori "Habis".
 */
export function isLowStock(p: StoredProduct): boolean {
  const min = p.minimumStock ?? DEFAULT_MINIMUM_STOCK;
  if (p.variants && p.variants.length > 0) {
    return p.variants.some((v) => {
      const s = v.stok ?? 0;
      return s > 0 && s <= min;
    });
  }
  const s = p.stok ?? 0;
  return s > 0 && s <= min;
}

/** Ada minimal satu variasi (atau produk tanpa variasi) dengan stok > 0. */
export function hasInStock(p: StoredProduct): boolean {
  if (p.variants && p.variants.length > 0) {
    return p.variants.some((v) => (v.stok ?? 0) > 0);
  }
  return (p.stok ?? 0) > 0;
}

/** Ada minimal satu variasi (atau produk tanpa variasi) dengan stok = 0. */
export function hasOutOfStock(p: StoredProduct): boolean {
  if (p.variants && p.variants.length > 0) {
    return p.variants.some((v) => (v.stok ?? 0) <= 0);
  }
  return (p.stok ?? 0) <= 0;
}

const STORAGE_KEY = "maqilerp-products";

function loadProducts(): StoredProduct[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as StoredProduct[]) : [];
  } catch {
    return [];
  }
}

function saveProducts(items: StoredProduct[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Abaikan kegagalan quota; state in-memory tetap akurat.
  }
}

let state: StoredProduct[] = loadProducts();
const listeners = new Set<() => void>();

const emit = () => {
  for (const l of listeners) l();
};

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};

const getSnapshot = () => state;

const commit = (next: StoredProduct[]) => {
  state = next;
  saveProducts(state);
  emit();
};

export const productStore = {
  getAll(): StoredProduct[] {
    return state;
  },
  getById(id: string): StoredProduct | undefined {
    return state.find((p) => p.id === id);
  },
  addProduct(product: StoredProduct) {
    commit([product, ...state]);
  },
  updateProduct(id: string, patch: Partial<StoredProduct>) {
    let changed = false;
    const next = state.map((p) => {
      if (p.id === id) {
        changed = true;
        return { ...p, ...patch, id: p.id, updatedAt: Date.now() };
      }
      return p;
    });
    if (changed) commit(next);
  },
  deleteProduct(id: string) {
    const next = state.filter((p) => p.id !== id);
    if (next.length !== state.length) commit(next);
  },
  /**
   * Soft delete: pindahkan produk ke arsip tanpa menghapus data.
   * Menyimpan previousStatus agar dapat dipulihkan via restoreProduct.
   */
  archiveProduct(id: string) {
    let changed = false;
    const next = state.map((p) => {
      if (p.id !== id) return p;
      if (p.status === "archive") return p;
      changed = true;
      const now = Date.now();
      return {
        ...p,
        previousStatus: p.status,
        status: "archive" as StoredProductStatus,
        deletedAt: now,
        updatedAt: now,
      };
    });
    if (changed) commit(next);
  },
  /**
   * Pulihkan produk dari arsip ke status sebelumnya (default: draft).
   */
  restoreProduct(id: string) {
    let changed = false;
    const next = state.map((p) => {
      if (p.id !== id) return p;
      if (p.status !== "archive") return p;
      changed = true;
      const now = Date.now();
      const { deletedAt: _deletedAt, previousStatus, ...rest } = p;
      void _deletedAt;
      return {
        ...rest,
        status: (previousStatus ?? "draft") as StoredProductStatus,
        previousStatus: undefined,
        updatedAt: now,
      };
    });
    if (changed) commit(next);
  },
  subscribe,
};

export function useProducts(): StoredProduct[] {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function useProductsByStatus(status: StoredProductStatus): StoredProduct[] {
  const all = useProducts();
  return all.filter((p) => p.status === status);
}
