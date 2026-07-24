/**
 * Facade `AttributeService` — mendelegasikan ke implementasi aktif pada
 * `catalogServices.attribute`. Pergantian implementasi (dummy → Shopee)
 * dilakukan di `src/services/catalog/index.ts` tanpa mengubah konsumen.
 */

import { catalogServices } from "./catalog";

export type {
  ShopeeAttribute,
  ShopeeAttributeInputType,
  ShopeeAttributeValue,
  IAttributeService,
} from "./catalog/types";

export const AttributeService = {
  getAttributesForCategory: (
    categoryPath: { id: number | string; name: string }[],
  ) => catalogServices.attribute.getAttributesForCategory(categoryPath),
};
