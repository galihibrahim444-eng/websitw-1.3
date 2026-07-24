// =============================================================================
// Product Status — Single Source of Truth
// =============================================================================
// Seluruh modul Produk (halaman Semua Produk, Live, Draft, Arsip, dsb.) WAJIB
// memakai status ERP dari file ini. Jangan menulis string status secara langsung
// di komponen. Ketika marketplace (Shopee, Tokopedia, TikTok Shop, Lazada)
// dihubungkan, adapter marketplace cukup memetakan status internal mereka ke
// enum `ProductStatus` melalui `mapMarketplaceProductStatus()`.
// =============================================================================

import type { MasterProduct } from "@/data/products";
import type { MarketplaceName } from "@/services/marketplaceAccountService";

/** 5 status utama produk di ERP. */
export const PRODUCT_STATUS = {
  AKTIF: "aktif",
  HABIS: "habis",
  DIPERIKSA: "diperiksa",
  DISIAPKAN: "disiapkan",
  DIHAPUS: "dihapus",
} as const;

export type ProductStatus = (typeof PRODUCT_STATUS)[keyof typeof PRODUCT_STATUS];

/** Definisi tab status: urutan tampil + label UI. */
export const PRODUCT_STATUS_TABS: ReadonlyArray<{
  value: ProductStatus;
  label: string;
}> = [
  { value: PRODUCT_STATUS.AKTIF, label: "Aktif" },
  { value: PRODUCT_STATUS.HABIS, label: "Habis" },
  { value: PRODUCT_STATUS.DIPERIKSA, label: "Stok Menipis" },
  { value: PRODUCT_STATUS.DISIAPKAN, label: "Disiapkan" },
  { value: PRODUCT_STATUS.DIHAPUS, label: "Dihapus" },
];

/** Label human-readable untuk satu status. */
export const PRODUCT_STATUS_LABEL: Record<ProductStatus, string> = {
  aktif: "Aktif",
  habis: "Habis",
  diperiksa: "Diperiksa",
  disiapkan: "Disiapkan",
  dihapus: "Dihapus",
};

/**
 * Turunkan status ERP dari data master produk lokal (mock/ERP internal).
 * Aturan:
 *  - productStatus "Arsip"  -> Dihapus
 *  - productStatus "Draft"  -> Disiapkan
 *  - stock <= 0             -> Habis
 *  - selain itu             -> Aktif
 * Status "Diperiksa" hanya dihasilkan oleh mapping dari marketplace (belum
 * ada representasi di data lokal).
 */
export function getProductStatus(p: MasterProduct): ProductStatus {
  if (p.productStatus === "Arsip") return PRODUCT_STATUS.DIHAPUS;
  if (p.productStatus === "Draft") return PRODUCT_STATUS.DISIAPKAN;
  if (p.stock <= 0) return PRODUCT_STATUS.HABIS;
  return PRODUCT_STATUS.AKTIF;
}

// ---------------------------------------------------------------------------
// Marketplace mapping (pondasi — belum ada API call)
// ---------------------------------------------------------------------------
// Setiap marketplace memakai istilah berbeda untuk status produk. Peta di
// bawah menerjemahkan istilah tersebut ke `ProductStatus`. Adapter API
// marketplace cukup memanggil `mapMarketplaceProductStatus(marketplace, raw)`
// tanpa perlu mengetahui detail ERP.

type StatusMap = Record<string, ProductStatus>;

const SHOPEE_STATUS: StatusMap = {
  NORMAL: PRODUCT_STATUS.AKTIF,
  LIVE: PRODUCT_STATUS.AKTIF,
  UNLISTED: PRODUCT_STATUS.DISIAPKAN,
  DRAFT: PRODUCT_STATUS.DISIAPKAN,
  REVIEWING: PRODUCT_STATUS.DIPERIKSA,
  BANNED: PRODUCT_STATUS.DIHAPUS,
  DELETED: PRODUCT_STATUS.DIHAPUS,
  SOLD_OUT: PRODUCT_STATUS.HABIS,
};

const TOKOPEDIA_STATUS: StatusMap = {
  ACTIVE: PRODUCT_STATUS.AKTIF,
  INACTIVE: PRODUCT_STATUS.DISIAPKAN,
  PENDING: PRODUCT_STATUS.DIPERIKSA,
  BANNED: PRODUCT_STATUS.DIHAPUS,
  DELETED: PRODUCT_STATUS.DIHAPUS,
  EMPTY: PRODUCT_STATUS.HABIS,
};

const TIKTOK_STATUS: StatusMap = {
  ACTIVATE: PRODUCT_STATUS.AKTIF,
  LIVE: PRODUCT_STATUS.AKTIF,
  DRAFT: PRODUCT_STATUS.DISIAPKAN,
  REVIEWING: PRODUCT_STATUS.DIPERIKSA,
  SELLER_DEACTIVATED: PRODUCT_STATUS.DISIAPKAN,
  PLATFORM_DEACTIVATED: PRODUCT_STATUS.DIHAPUS,
  DELETED: PRODUCT_STATUS.DIHAPUS,
  OUT_OF_STOCK: PRODUCT_STATUS.HABIS,
};

const LAZADA_STATUS: StatusMap = {
  ACTIVE: PRODUCT_STATUS.AKTIF,
  INACTIVE: PRODUCT_STATUS.DISIAPKAN,
  PENDING: PRODUCT_STATUS.DIPERIKSA,
  REJECTED: PRODUCT_STATUS.DIHAPUS,
  DELETED: PRODUCT_STATUS.DIHAPUS,
  SOLDOUT: PRODUCT_STATUS.HABIS,
};

const MARKETPLACE_STATUS_MAP: Record<MarketplaceName, StatusMap> = {
  Shopee: SHOPEE_STATUS,
  Tokopedia: TOKOPEDIA_STATUS,
  "TikTok Shop": TIKTOK_STATUS,
  Lazada: LAZADA_STATUS,
};

/**
 * Terjemahkan status mentah dari marketplace ke `ProductStatus`.
 * Kembalikan `null` jika status tidak dikenali agar caller bisa memutuskan
 * (log warning, biarkan status sebelumnya, dsb.) alih-alih diam-diam salah.
 */
export function mapMarketplaceProductStatus(
  marketplace: MarketplaceName,
  rawStatus: string,
): ProductStatus | null {
  const map = MARKETPLACE_STATUS_MAP[marketplace];
  if (!map) return null;
  return map[rawStatus.toUpperCase()] ?? null;
}
