/**
 * Registry service produk. Ganti binding di sini saat beralih ke
 * ShopeeProductService — komponen UI tidak perlu berubah.
 */

import type { IProductService } from "./types";
import { dummyProductService } from "./dummyProductService";

export const productService: IProductService = dummyProductService;

export * from "./types";
