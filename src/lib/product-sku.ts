/**
 * Helper terpusat untuk membangun SKU varian produk.
 *
 * Digunakan oleh komponen form produk dan (nanti) oleh layer sinkronisasi
 * Shopee Open API — pastikan seluruh pemanggil menggunakan helper ini agar
 * format SKU konsisten antara UI dan payload marketplace.
 */

/**
 * Normalisasi token SKU: uppercase, spasi -> "-", karakter selain A-Z/0-9/"-" dibuang.
 * Contoh: "Kaos Polos" -> "KAOS-POLOS".
 */
export function normalizeSkuToken(input: string): string {
  return input
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "-")
    .replace(/[^A-Z0-9-]+/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export type GenerateVariantSkuInput = {
  /** SKU Induk produk. Boleh kosong. */
  parentSku?: string;
  /** Nilai variasi terurut (Variasi 1, Variasi 2, ...). */
  options: string[];
};

/**
 * Menghasilkan SKU varian: `[SKU_INDUK]-[OPSI_1]-[OPSI_2]...`.
 *
 * Contoh:
 *   generateVariantSku({ parentSku: "TAPED", options: ["Hitam", "M"] })
 *   // => "TAPED-HITAM-M"
 */
export function generateVariantSku(input: GenerateVariantSkuInput): string {
  const { parentSku = "", options } = input;
  return [parentSku, ...options]
    .map(normalizeSkuToken)
    .filter((s) => s.length > 0)
    .join("-");
}
