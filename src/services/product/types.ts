/**
 * Abstraction untuk service produk (create/update).
 *
 * Implementasi awal menggunakan DummyProductService. Untuk beralih ke
 * Shopee Open API cukup mengganti binding pada `src/services/product/index.ts`
 * tanpa mengubah UI atau komponen apapun.
 */

import type { ProductInformation } from "@/lib/product-information";
import type { ProductMedia } from "@/lib/product-media";
import type { ProductVariationOption } from "@/lib/product-variations";
import type { ProductVariant } from "@/lib/variant-sku";
import type { MarketplaceName } from "@/services/marketplaceAccountService";

/** Aksi save yang tersedia untuk halaman Tambah Produk. */
export type ProductSaveAction = "draft" | "publish" | "archive";

/** Status produk (mengikuti Shopee Open API item status). */
export type ProductPersistStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";

export const SAVE_ACTION_STATUS: Record<ProductSaveAction, ProductPersistStatus> = {
  draft: "DRAFT",
  publish: "ACTIVE",
  archive: "ARCHIVED",
};

/** Payload kanonik yang dikirim ke service produk. */
export interface ProductSavePayload {
  shopId: string | number;
  merchantId: string | number;
  marketplace: MarketplaceName;
  status: ProductPersistStatus;
  productInformation: ProductInformation;
  media: ProductMedia;
  parentSku: string;
  weightGram: number;
  variasi: "tunggal" | "berbagai";
  /** Harga Modal (HPP) product-level. Berlaku untuk seluruh variasi. */
  hpp: string;
  singlePrice: string;
  singleStock: string;
  variations: ProductVariationOption[];
  variants: Record<string, ProductVariant>;
  preOrder: "tidak" | "ya";
  kondisi: "baru" | "pernah";
  sumbers: { pemasok: string; produk: string }[];
}

export interface ProductSaveResult {
  productId: string | number;
  status: ProductPersistStatus;
}

/**
 * Canonical Product DTO — bentuk yang akan dikirim/diterima oleh backend
 * NestJS (REST). UI dan store internal boleh berbeda bentuk, tetapi
 * SEMUA komunikasi lintas layer (service ↔ backend) menggunakan tipe ini.
 *
 * Endpoint target:
 *   GET    /products
 *   GET    /products/:id
 *   POST   /products
 *   PATCH  /products/:id
 *   DELETE /products/:id
 *
 * CATATAN: field `price` (legacy) TIDAK ada di sini. Gunakan `sellingPrice`.
 */
export interface ProductVariantDTO {
  sku: string;
  hpp?: number;
  sellingPrice: number;
  stock: number;
  reservedStock?: number;
  image?: string | null;
  active: boolean;
}

export interface Product {
  id: string;
  productCode: string;
  parentSku: string;
  sku: string;
  name: string;
  /** Harga Modal (HPP). Hanya diubah oleh user ERP, TIDAK boleh ditimpa sinkron marketplace. */
  hpp?: number;
  /** Harga Jual. Boleh diperbarui oleh sinkron marketplace. */
  sellingPrice: number;
  stock: number;
  reservedStock: number;
  weight: number;
  category: string;
  status: ProductPersistStatus;
  marketplace: MarketplaceName | string;
  images: string[];
  variants: ProductVariantDTO[];
  createdAt: string;
  updatedAt: string;
}

export type ProductCreateInput = Omit<Product, "id" | "createdAt" | "updatedAt">;
export type ProductUpdateInput = Partial<Omit<Product, "id" | "createdAt" | "updatedAt">>;

export interface IProductService {
  /** POST /products dari halaman "Tambah Produk". */
  saveProduct(
    payload: ProductSavePayload,
    action: ProductSaveAction,
  ): Promise<ProductSaveResult>;

  /** GET /products */
  listProducts(): Promise<Product[]>;
  /** GET /products/:id */
  getProduct(id: string): Promise<Product | null>;
  /** PATCH /products/:id — dipakai oleh inline edit HPP/Harga Jual. */
  updateProduct(id: string, patch: ProductUpdateInput): Promise<Product>;
  /** DELETE /products/:id (soft delete → status ARCHIVED). */
  deleteProduct(id: string): Promise<void>;
}

