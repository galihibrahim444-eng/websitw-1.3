/**
 * Facade `BrandService` — mendelegasikan ke implementasi aktif pada
 * `catalogServices.brand`. Pergantian implementasi (dummy → Shopee) cukup
 * dilakukan di `src/services/catalog/index.ts` tanpa mengubah konsumen.
 */

import { catalogServices } from "./catalog";

export type { ShopeeBrand, IBrandService } from "./catalog/types";

export const BrandService = {
  getBrandsForCategory: (
    categoryPath: { id: number | string; name: string }[],
  ) => catalogServices.brand.getBrandsForCategory(categoryPath),
};
