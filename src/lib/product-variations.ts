/**
 * State model untuk "Berbagai Variasi" pada halaman Tambah Produk.
 * Struktur ini dipetakan langsung ke Shopee Open API:
 *   variations[].name    -> tier_variation[].name
 *   variations[].values  -> tier_variation[].option_list
 */

export type ProductVariationValue = {
  id: string;
  label: string;
  /**
   * Referensi ke `ProductMedia.images[].id`. Gambar tidak disimpan
   * langsung di sini — cukup mediaId agar payload Shopee Open API
   * hanya perlu mengambil dari ProductMedia.
   */
  imageMediaId?: string;
};

export type ProductVariationOption = {
  id: string;
  name: string;
  /** Aktifkan slot gambar per value (Shopee: hanya grup pertama). */
  useImage?: boolean;
  values: ProductVariationValue[];
};

/** Nama-nama variasi yang otomatis mengaktifkan slot gambar. */
const COLOR_NAME_PATTERN = /^\s*(warna|colou?r)\s*$/i;

export function shouldAutoUseImage(name: string): boolean {
  return COLOR_NAME_PATTERN.test(name);
}

export const MAX_VARIATION_GROUPS = 2;
export const MAX_VARIATION_NAME_LENGTH = 14;
export const MAX_VARIATION_VALUE_LENGTH = 20;

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

export const createEmptyVariationValue = (): ProductVariationValue => ({
  id: uid(),
  label: "",
});

export const createEmptyVariationOption = (
  name = "",
): ProductVariationOption => ({
  id: uid(),
  name,
  values: [createEmptyVariationValue()],
});
