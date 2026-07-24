/**
 * Registry layanan katalog produk.
 *
 * Konsumen (hook / UI) mengimpor `catalogServices` — bukan implementasi
 * konkret. Untuk beralih ke Shopee Open API cukup ganti binding di sini
 * (mis. `category: shopeeCategoryService`) tanpa menyentuh UI atau
 * business logic manapun.
 */

import type { ICatalogServices } from "./types";
import { dummyCategoryService } from "./dummyCategoryService";
import { dummyBrandService } from "./dummyBrandService";
import { dummyAttributeService } from "./dummyAttributeService";

export const catalogServices: ICatalogServices = {
  category: dummyCategoryService,
  brand: dummyBrandService,
  attribute: dummyAttributeService,
};

export * from "./types";
