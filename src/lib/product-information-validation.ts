/**
 * Validasi ProductInformation.
 *
 * Aturan (mengikuti Shopee Open API `product/add_item`):
 *   - productName wajib & tidak melebihi PRODUCT_NAME_MAX_LENGTH.
 *   - categoryId wajib (leaf kategori terpilih).
 *   - description tidak melebihi PRODUCT_DESCRIPTION_MAX_LENGTH.
 *   - brandId wajib jika kategori memiliki daftar brand
 *     (mis. Fashion/Elektronik). Kategori tanpa brand list → opsional.
 *   - Setiap atribut dengan `is_mandatory: true` harus terisi minimal
 *     satu nilai non-kosong (mengikuti definisi service).
 *
 * Tidak melakukan mutasi state — hanya menghasilkan daftar error.
 */

import {
  PRODUCT_DESCRIPTION_MAX_LENGTH,
  PRODUCT_NAME_MAX_LENGTH,
  type ProductInformation,
} from "./product-information";
import type { ShopeeAttribute } from "@/services/attributeService";
import type { ShopeeBrand } from "@/services/brandService";

export type ProductInformationError = {
  /** Field logis yang bermasalah (untuk mapping ke UI bila perlu). */
  field:
    | "productName"
    | "categoryId"
    | "brandId"
    | "description"
    | `attribute:${string | number}`;
  message: string;
};

export function validateProductInformation(input: {
  info: ProductInformation;
  /** Brand yang tersedia untuk kategori terpilih (sudah dimuat dari service). */
  categoryBrands: ShopeeBrand[];
  /** Atribut yang berlaku untuk kategori terpilih. */
  categoryAttributes: ShopeeAttribute[];
}): ProductInformationError[] {
  const { info, categoryBrands, categoryAttributes } = input;
  const errors: ProductInformationError[] = [];

  // Nama Produk wajib.
  const name = info.productName.trim();
  if (!name) {
    errors.push({ field: "productName", message: "Nama Produk wajib diisi." });
  } else if (name.length > PRODUCT_NAME_MAX_LENGTH) {
    errors.push({
      field: "productName",
      message: `Nama Produk maksimal ${PRODUCT_NAME_MAX_LENGTH} karakter.`,
    });
  }

  // Kategori wajib (leaf terpilih).
  if (info.categoryId == null || !info.categoryPath.length) {
    errors.push({ field: "categoryId", message: "Kategori wajib dipilih." });
  }

  // Deskripsi mengikuti limit karakter (kosong diperbolehkan di sini —
  // required-nya dikendalikan oleh UI FieldRow, bukan aturan Shopee).
  if (info.description.length > PRODUCT_DESCRIPTION_MAX_LENGTH) {
    errors.push({
      field: "description",
      message: `Deskripsi maksimal ${PRODUCT_DESCRIPTION_MAX_LENGTH} karakter.`,
    });
  }

  // Brand wajib bila kategori menyediakan daftar brand.
  if (categoryBrands.length > 0 && info.brandId == null) {
    errors.push({ field: "brandId", message: "Brand wajib dipilih." });
  }

  // Atribut wajib mengikuti definisi service.
  for (const attr of categoryAttributes) {
    if (!attr.is_mandatory) continue;
    const filled = info.attributes.find(
      (a) => String(a.attributeId) === String(attr.attribute_id),
    );
    const hasValue =
      !!filled &&
      filled.values.some((v) => (v?.value ?? "").toString().trim() !== "");
    if (!hasValue) {
      errors.push({
        field: `attribute:${attr.attribute_id}`,
        message: `Atribut "${attr.display_attribute_name}" wajib diisi.`,
      });
    }
  }

  return errors;
}
