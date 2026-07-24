// =============================================================================
// Product Status — Business Rules
// =============================================================================
// Helper terpisah yang mendefinisikan aturan bisnis untuk setiap status produk
// ERP. Modul ini tidak menyentuh UI; ia hanya mengevaluasi kondisi input
// (`ProductLifecycleInput`) dan mengembalikan `ProductStatus` yang sesuai.
//
// Sumber kebenaran status tetap `src/lib/product-status.ts`. File ini
// melengkapinya dengan:
//   - Deskripsi tiap status (untuk dokumentasi / tooltip di masa depan).
//   - Predikat per-status (`isAktif`, `isHabis`, dst.) yang bisa dipakai
//     di service lain (sinkronisasi marketplace, validator publish, dsb.).
//   - `resolveProductStatus()` — mesin aturan tunggal yang menerima kondisi
//     produk (published, reviewing, stock, deleted, dst.) dan menghasilkan
//     status ERP final.
//
// Ketika marketplace dihubungkan, adapter cukup mengisi
// `ProductLifecycleInput` dari payload API mereka lalu memanggil
// `resolveProductStatus()`.
// =============================================================================

import { PRODUCT_STATUS, type ProductStatus } from "./product-status";

/** Input netral yang menggambarkan kondisi sebuah produk. */
export interface ProductLifecycleInput {
  /** Produk sudah pernah berhasil dipublish ke marketplace. */
  isPublished: boolean;
  /** Produk aktif (tidak di-unlist / tidak di-nonaktifkan penjual). */
  isActiveOnMarketplace: boolean;
  /** Produk sedang direview marketplace dan belum bisa dijual. */
  isReviewing: boolean;
  /** Produk sudah tersinkron dengan marketplace minimal satu kali. */
  isSynced: boolean;
  /** Soft-deleted / diarsipkan. Data masih tersimpan. */
  isDeleted: boolean;
  /** Jumlah stok saat ini. */
  stock: number;
}

/** Deskripsi bisnis untuk setiap status — dipakai untuk dokumentasi/tooltip. */
export const PRODUCT_STATUS_RULES: Record<
  ProductStatus,
  { title: string; rules: readonly string[] }
> = {
  [PRODUCT_STATUS.AKTIF]: {
    title: "Aktif",
    rules: [
      "Produk berhasil dipublish.",
      "Produk aktif di marketplace.",
      "Produk memiliki stok lebih dari 0.",
    ],
  },
  [PRODUCT_STATUS.HABIS]: {
    title: "Habis",
    rules: ["Produk masih aktif.", "Stok sama dengan 0."],
  },
  [PRODUCT_STATUS.DIPERIKSA]: {
    title: "Diperiksa",
    rules: [
      "Produk sedang menunggu review marketplace.",
      "Belum bisa dijual.",
    ],
  },
  [PRODUCT_STATUS.DISIAPKAN]: {
    title: "Disiapkan",
    rules: [
      "Produk masih draft.",
      "Belum pernah dipublish.",
      "Belum sinkronisasi.",
    ],
  },
  [PRODUCT_STATUS.DIHAPUS]: {
    title: "Dihapus",
    rules: [
      "Soft delete.",
      "Produk tidak tampil pada daftar aktif.",
      "Data tetap tersimpan.",
    ],
  },
};

// ---------------------------------------------------------------------------
// Predicates per status
// ---------------------------------------------------------------------------

/** Soft delete menang di atas seluruh status lain. */
export function isDihapus(i: ProductLifecycleInput): boolean {
  return i.isDeleted;
}

/**
 * Disiapkan: masih draft (belum pernah dipublish) dan belum tersinkron.
 * Tidak berlaku bila produk sudah dihapus.
 */
export function isDisiapkan(i: ProductLifecycleInput): boolean {
  if (i.isDeleted) return false;
  return !i.isPublished && !i.isSynced;
}

/** Diperiksa: sedang menunggu review marketplace. */
export function isDiperiksa(i: ProductLifecycleInput): boolean {
  if (i.isDeleted) return false;
  return i.isReviewing;
}

/** Habis: sudah published & aktif namun stok 0. */
export function isHabis(i: ProductLifecycleInput): boolean {
  if (i.isDeleted || i.isReviewing) return false;
  return i.isPublished && i.isActiveOnMarketplace && i.stock <= 0;
}

/** Aktif: published, aktif di marketplace, dan stok > 0. */
export function isAktif(i: ProductLifecycleInput): boolean {
  if (i.isDeleted || i.isReviewing) return false;
  return i.isPublished && i.isActiveOnMarketplace && i.stock > 0;
}

// ---------------------------------------------------------------------------
// Rule engine
// ---------------------------------------------------------------------------

/**
 * Evaluasi berjenjang. Urutan prioritas:
 *   Dihapus → Diperiksa → Disiapkan → Habis → Aktif
 * Fallback `Disiapkan` dipakai jika tidak ada aturan lain yang cocok (mis.
 * produk sudah published tapi tidak aktif dan tidak sedang direview — perlu
 * disiapkan ulang sebelum bisa dijual).
 */
export function resolveProductStatus(
  input: ProductLifecycleInput,
): ProductStatus {
  if (isDihapus(input)) return PRODUCT_STATUS.DIHAPUS;
  if (isDiperiksa(input)) return PRODUCT_STATUS.DIPERIKSA;
  if (isDisiapkan(input)) return PRODUCT_STATUS.DISIAPKAN;
  if (isHabis(input)) return PRODUCT_STATUS.HABIS;
  if (isAktif(input)) return PRODUCT_STATUS.AKTIF;
  return PRODUCT_STATUS.DISIAPKAN;
}
