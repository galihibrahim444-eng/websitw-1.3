/**
 * Duplikasi produk antar toko.
 *
 * Fungsi ini sengaja dipisahkan dari komponen UI dan dari `productStore`
 * agar mudah diganti dengan panggilan `POST /products/copy` (Shopee Copy
 * Product API) di masa depan. Signature-nya diusahakan tidak berubah.
 */
import type { StoredProduct, StoredVariant } from "./product-store";
import { productStore } from "./product-store";
import type { ProductSavePayload } from "@/services/product/types";

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `prod-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

/**
 * Menghasilkan SKU unik dalam scope toko tujuan. Jika `base` kosong,
 * dikembalikan apa adanya (biar tidak memaksa SKU pada produk yang memang
 * belum punya).
 */
function makeUniqueSku(base: string, targetShop: string, taken: Set<string>): string {
  if (!base) return base;
  const scoped = (s: string) => `${targetShop}::${s}`;
  if (!taken.has(scoped(base))) {
    taken.add(scoped(base));
    return base;
  }
  const withCopy = `${base}-COPY`;
  if (!taken.has(scoped(withCopy))) {
    taken.add(scoped(withCopy));
    return withCopy;
  }
  let n = 2;
  while (taken.has(scoped(`${base}-${n}`))) n++;
  const finalSku = `${base}-${n}`;
  taken.add(scoped(finalSku));
  return finalSku;
}

/**
 * Duplikasi produk ke toko tujuan. Menghasilkan produk baru berstatus
 * `draft` dan langsung menyimpannya ke `productStore` (localStorage).
 */
export function duplicateProduct(
  sourceId: string,
  targetShop: string,
): StoredProduct | null {
  const source = productStore.getById(sourceId);
  if (!source) return null;

  // Set SKU yang sudah dipakai di toko tujuan (untuk deteksi bentrok).
  const taken = new Set<string>();
  for (const p of productStore.getAll()) {
    if (p.marketplace !== targetShop) continue;
    if (p.skuInduk) taken.add(`${targetShop}::${p.skuInduk}`);
    for (const v of p.variants ?? []) {
      if (v.sku) taken.add(`${targetShop}::${v.sku}`);
    }
  }

  const newParentSku = makeUniqueSku(source.skuInduk, targetShop, taken);
  const newVariants: StoredVariant[] = (source.variants ?? []).map((v) => ({
    ...v,
    sku: makeUniqueSku(v.sku, targetShop, taken),
  }));

  // Rehidrasi snapshot form (raw) agar Edit Produk tetap bisa memuat
  // seluruh field: media, variasi, atribut, deskripsi, dsb.
  const rawClone: ProductSavePayload | undefined = source.raw
    ? (JSON.parse(JSON.stringify(source.raw)) as ProductSavePayload)
    : undefined;

  if (rawClone) {
    rawClone.marketplace = targetShop as ProductSavePayload["marketplace"];
    rawClone.status = "DRAFT";
    rawClone.parentSku = newParentSku;
    // Sinkronkan SKU tiap kombinasi variasi dengan SKU baru di atas.
    if (rawClone.variants && source.variants) {
      const keys = Object.keys(rawClone.variants);
      keys.forEach((k, idx) => {
        const nv = newVariants[idx];
        if (nv && rawClone.variants[k]) {
          rawClone.variants[k] = { ...rawClone.variants[k], sku: nv.sku };
        }
      });
    }
  }

  const now = Date.now();
  const duplicated: StoredProduct = {
    ...source,
    id: uid(),
    marketplace: targetShop,
    status: "draft",
    createdAt: now,
    updatedAt: now,
    skuInduk: newParentSku,
    variants: newVariants,
    raw: rawClone,
  };

  productStore.addProduct(duplicated);
  return duplicated;
}
