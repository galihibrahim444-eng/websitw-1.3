import type { ProductVariationOption } from "./product-variations";

/**
 * Data per baris SKU (kombinasi varian).
 * Bentuk field kompatibel dengan payload item Shopee Open API.
 */
export type ProductVariant = {
  price: string;
  stock: string;
  sku: string;
  status: "aktif" | "nonaktif";
};

export type VariantCombination = {
  /** Kunci stabil berdasarkan valueId — aman terhadap perubahan label. */
  key: string;
  /** Value dari tiap grup (urutan sama dengan `variations`). */
  parts: {
    groupId: string;
    groupName: string;
    valueId: string;
    valueLabel: string;
    imageMediaId?: string;
  }[];
};

export const emptyProductVariant = (): ProductVariant => ({
  price: "",
  stock: "",
  sku: "",
  status: "aktif",
});

/**
 * Membangun seluruh kombinasi (cartesian product) dari variasi.
 * Grup tanpa value berlabel diabaikan agar tidak menghasilkan baris kosong.
 */
export function buildVariantCombinations(
  variations: ProductVariationOption[],
): VariantCombination[] {
  const groups = variations
    .map((g) => ({
      group: g,
      values: g.values.filter((v) => v.label.trim().length > 0),
    }))
    .filter((g) => g.values.length > 0);

  if (groups.length === 0) return [];

  const seed: VariantCombination[] = [{ key: "", parts: [] }];
  return groups.reduce<VariantCombination[]>((acc, { group, values }) => {
    const next: VariantCombination[] = [];
    for (const combo of acc) {
      for (const val of values) {
        next.push({
          key: combo.key ? `${combo.key}|${val.id}` : val.id,
          parts: [
            ...combo.parts,
            {
              groupId: group.id,
              groupName: group.name,
              valueId: val.id,
              valueLabel: val.label,
              imageMediaId: val.imageMediaId,
            },
          ],
        });
      }
    }
    return next;
  }, seed);
}

// SKU helpers dipindahkan ke `src/lib/product-sku.ts` sebagai single source
// of truth (juga akan dipakai oleh sinkronisasi Shopee Open API).
export { generateVariantSku, normalizeSkuToken } from "./product-sku";

