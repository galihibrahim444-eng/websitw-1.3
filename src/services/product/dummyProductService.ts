/**
 * Implementasi dummy IProductService yang di-back oleh `productStore`
 * (localStorage). Layer ini adalah SATU-SATUNYA titik yang di-swap saat
 * backend NestJS aktif — komponen UI tidak perlu berubah.
 *
 * Pemetaan endpoint:
 *   saveProduct   → POST   /products
 *   listProducts  → GET    /products
 *   getProduct    → GET    /products/:id
 *   updateProduct → PATCH  /products/:id
 *   deleteProduct → DELETE /products/:id  (soft delete → status ARCHIVED)
 */

import type {
  IProductService,
  Product,
  ProductSaveAction,
  ProductSavePayload,
  ProductSaveResult,
  ProductUpdateInput,
  ProductVariantDTO,
} from "./types";
import { SAVE_ACTION_STATUS } from "./types";
import {
  productStore,
  type StoredProduct,
  type StoredProductStatus,
} from "@/lib/product-store";
import { payloadToStoredProduct } from "@/lib/product-store-mapper";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

const STATUS_TO_DTO: Record<StoredProductStatus, Product["status"]> = {
  draft: "DRAFT",
  live: "ACTIVE",
  archive: "ARCHIVED",
};
const DTO_TO_STATUS: Record<Product["status"], StoredProductStatus> = {
  DRAFT: "draft",
  ACTIVE: "live",
  ARCHIVED: "archive",
};

/** StoredProduct (internal) → Product (canonical DTO / backend). */
export function toProductDTO(p: StoredProduct): Product {
  const variants: ProductVariantDTO[] = (p.variants ?? []).map((v) => ({
    sku: v.sku,
    hpp: p.hpp,
    sellingPrice: v.harga ?? 0,
    stock: v.stok ?? 0,
    reservedStock: 0,
    image: v.gambar ?? null,
    active: !!v.status,
  }));
  return {
    id: p.id,
    productCode: p.id,
    parentSku: p.skuInduk ?? "",
    sku: p.skuInduk ?? "",
    name: p.namaProduk ?? "",
    hpp: p.hpp,
    sellingPrice: p.sellingPrice ?? p.harga ?? 0,
    stock: p.stok ?? 0,
    reservedStock: 0,
    weight: p.raw?.weightGram ?? 0,
    category: p.kategori ?? "",
    status: STATUS_TO_DTO[p.status],
    marketplace: p.marketplace ?? "",
    images: p.fotoCover ? [p.fotoCover] : [],
    variants,
    createdAt: new Date(p.createdAt).toISOString(),
    updatedAt: new Date(p.updatedAt).toISOString(),
  };
}

/** Terjemahkan patch DTO (backend) → patch StoredProduct (internal). */
function dtoPatchToStoredPatch(patch: ProductUpdateInput): Partial<StoredProduct> {
  const out: Partial<StoredProduct> = {};
  if (patch.name !== undefined) out.namaProduk = patch.name;
  if (patch.parentSku !== undefined) out.skuInduk = patch.parentSku;
  if (patch.category !== undefined) out.kategori = patch.category;
  if (patch.marketplace !== undefined) out.marketplace = String(patch.marketplace);
  if (patch.status !== undefined) out.status = DTO_TO_STATUS[patch.status];
  if (patch.hpp !== undefined) out.hpp = patch.hpp;
  if (patch.sellingPrice !== undefined) {
    out.sellingPrice = patch.sellingPrice;
    // Legacy `harga` tetap disinkronkan untuk kompatibilitas data lama.
    out.harga = patch.sellingPrice;
  }
  if (patch.stock !== undefined) out.stok = patch.stock;
  if (patch.images !== undefined) out.fotoCover = patch.images[0] ?? null;
  return out;
}

export const dummyProductService: IProductService = {
  async saveProduct(
    payload: ProductSavePayload,
    action: ProductSaveAction,
  ): Promise<ProductSaveResult> {
    await delay(200);
    const stored = payloadToStoredProduct(payload);
    productStore.addProduct(stored);
    return {
      productId: stored.id,
      status: SAVE_ACTION_STATUS[action],
    };
  },

  async listProducts(): Promise<Product[]> {
    return productStore.getAll().map(toProductDTO);
  },

  async getProduct(id: string): Promise<Product | null> {
    const p = productStore.getById(id);
    return p ? toProductDTO(p) : null;
  },

  async updateProduct(id: string, patch: ProductUpdateInput): Promise<Product> {
    productStore.updateProduct(id, dtoPatchToStoredPatch(patch));
    const p = productStore.getById(id);
    if (!p) throw new Error(`Product ${id} tidak ditemukan.`);
    return toProductDTO(p);
  },

  async deleteProduct(id: string): Promise<void> {
    // Soft delete: pindahkan ke Arsip (sesuai kebijakan ERP).
    productStore.archiveProduct(id);
  },
};
