/**
 * Facade `CategoryService` — mendelegasikan ke implementasi aktif pada
 * `catalogServices.category`. Konsumen lama tetap kompatibel; pergantian
 * implementasi (dummy → Shopee) dilakukan di `src/services/catalog/index.ts`.
 */

import { catalogServices } from "./catalog";

export type {
  ShopeeCategoryNode,
  CategoryTreeNode,
  CategoryOption,
  ICategoryService,
} from "./catalog/types";

export const CategoryService = {
  getCategoryTree: () => catalogServices.category.getCategoryTree(),
  getCategoryOptions: () => catalogServices.category.getCategoryOptions(),
};
