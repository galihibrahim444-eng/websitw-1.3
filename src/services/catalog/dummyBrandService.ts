/**
 * Implementasi dummy `IBrandService`.
 *
 * Bentuk mengikuti Shopee `/product/get_brand_list`. Ganti isi fungsi
 * `getBrandsForCategory` dengan panggilan Shopee bila sudah siap.
 */

import type { IBrandService, ShopeeBrand } from "./types";

const DUMMY_BRANDS_BY_ROOT: Record<number, ShopeeBrand[]> = {
  // Fashion
  100: [
    { brand_id: 0,    original_brand_name: "No Brand", display_brand_name: "No Brand" },
    { brand_id: 1001, original_brand_name: "Erigo",    display_brand_name: "Erigo" },
    { brand_id: 1002, original_brand_name: "Uniqlo",   display_brand_name: "Uniqlo" },
    { brand_id: 1003, original_brand_name: "H&M",      display_brand_name: "H&M" },
  ],
  // Elektronik
  200: [
    { brand_id: 0,    original_brand_name: "No Brand", display_brand_name: "No Brand" },
    { brand_id: 2001, original_brand_name: "Samsung",  display_brand_name: "Samsung" },
    { brand_id: 2002, original_brand_name: "Xiaomi",   display_brand_name: "Xiaomi" },
    { brand_id: 2003, original_brand_name: "Apple",    display_brand_name: "Apple" },
  ],
};

export const dummyBrandService: IBrandService = {
  async getBrandsForCategory(categoryPath) {
    if (!categoryPath.length) return [];
    const rootId = Number(categoryPath[0].id);
    return (
      DUMMY_BRANDS_BY_ROOT[rootId] ?? [
        { brand_id: 0, original_brand_name: "No Brand", display_brand_name: "No Brand" },
      ]
    );
  },
};
