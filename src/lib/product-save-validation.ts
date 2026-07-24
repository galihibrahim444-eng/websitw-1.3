/**
 * Validasi menyeluruh untuk save action `publish` / `archive`.
 *
 * Aturan minimum (sesuai Shopee Open API `product/add_item`):
 *   - Nama Produk, Kategori (via validateProductInformation)
 *   - Minimal 1 gambar produk
 *   - Berat (gram) > 0
 *   - Harga & Stok (variasi tunggal) atau minimal 1 kombinasi SKU
 *     dengan harga & stok terisi (berbagai variasi)
 */

import { validateProductInformation } from "./product-information-validation";
import type { ProductSavePayload } from "@/services/product/types";
import { buildVariantCombinations } from "./variant-sku";
import type { ShopeeBrand } from "@/services/brandService";

export type ProductSaveError = { field: string; message: string };

export function validatePublishPayload(
  payload: ProductSavePayload,
  categoryBrands: ShopeeBrand[],
): ProductSaveError[] {
  const errors: ProductSaveError[] = [];

  errors.push(
    ...validateProductInformation({
      info: payload.productInformation,
      categoryBrands,
      categoryAttributes: [],
    }).map((e) => ({ field: String(e.field), message: e.message })),
  );

  if (payload.media.images.length === 0) {
    errors.push({ field: "media", message: "Minimal 1 gambar produk." });
  }

  const weight = Number(payload.weightGram);
  if (!Number.isFinite(weight) || weight <= 0) {
    errors.push({ field: "weight", message: "Berat produk wajib diisi." });
  }

  if (payload.variasi === "tunggal") {
    if (!payload.singlePrice.trim()) {
      errors.push({ field: "price", message: "Harga wajib diisi." });
    }
    if (!payload.singleStock.trim()) {
      errors.push({ field: "stock", message: "Stok wajib diisi." });
    }
  } else {
    const combos = buildVariantCombinations(payload.variations);
    if (combos.length === 0) {
      errors.push({
        field: "variations",
        message: "Minimal 1 kombinasi variasi harus tersedia.",
      });
    }
  }

  return errors;
}
