/**
 * Memetakan payload `saveProduct` menjadi bentuk minimal `StoredProduct`
 * yang disimpan di `productStore`. Bentuknya sengaja dijaga tetap simpel
 * (id, namaProduk, skuInduk, kategori, brand, fotoCover, harga, stok,
 * marketplace, status, variants[]) agar mudah dirender di halaman list
 * Live/Draft/Arsip tanpa transformasi tambahan.
 */

import type { ProductSavePayload } from "@/services/product/types";
import type { StoredProduct, StoredProductStatus, StoredVariant } from "./product-store";
import { buildVariantCombinations } from "./variant-sku";

const STATUS_MAP: Record<ProductSavePayload["status"], StoredProductStatus> = {
  DRAFT: "draft",
  ACTIVE: "live",
  ARCHIVED: "archive",
};

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `prod-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export function payloadToStoredProduct(
  payload: ProductSavePayload,
  existing?: Pick<StoredProduct, "id" | "createdAt">,
): StoredProduct {
  const now = Date.now();
  const coverImage =
    payload.media.images.find((i) => i.isCover) ?? payload.media.images[0] ?? null;

  const kategori =
    payload.productInformation.categoryPath
      ?.map((c) => c.name)
      .filter(Boolean)
      .join(" > ") || "";

  let variants: StoredVariant[] = [];
  let totalStok = 0;
  let hargaAgg = 0;

  if (payload.variasi === "berbagai") {
    const combos = buildVariantCombinations(payload.variations);
    variants = combos.map((c) => {
      const v = payload.variants[c.key];
      const harga = Number(v?.price) || 0;
      const stok = Number(v?.stock) || 0;
      const imageMediaId = c.parts.find((p) => p.imageMediaId)?.imageMediaId;
      const gambar =
        (imageMediaId
          ? payload.media.images.find((i) => i.id === imageMediaId)?.url
          : undefined) ??
        coverImage?.url ??
        null;
      totalStok += stok;
      if (harga > 0) hargaAgg = hargaAgg === 0 ? harga : Math.min(hargaAgg, harga);
      return {
        sku: v?.sku ?? "",
        harga,
        stok,
        gambar,
        status: (v?.status ?? "aktif") === "aktif",
      };
    });
  } else {
    hargaAgg = Number(payload.singlePrice) || 0;
    totalStok = Number(payload.singleStock) || 0;
  }

  const hppNum = payload.hpp ? Number(payload.hpp) : NaN;
  return {
    id: existing?.id ?? uid(),
    namaProduk: payload.productInformation.productName.trim(),
    skuInduk: payload.parentSku.trim(),
    kategori,
    brand: payload.productInformation.brandId != null
      ? String(payload.productInformation.brandId)
      : "",
    fotoCover: coverImage?.url ?? null,
    harga: hargaAgg,
    hpp: Number.isFinite(hppNum) && hppNum > 0 ? hppNum : undefined,
    sellingPrice: hargaAgg > 0 ? hargaAgg : undefined,
    stok: totalStok,
    marketplace: payload.marketplace,
    status: STATUS_MAP[payload.status],
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    variants,
    raw: payload,
  };
}
