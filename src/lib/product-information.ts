/**
 * Single Source of Truth untuk seluruh field pada section
 * "Informasi Dasar" & "Informasi Produk" pada halaman Tambah Produk.
 *
 * Struktur ini dipetakan langsung ke payload Shopee Open API
 * (product/add_item) sehingga tidak ada transformasi ganda:
 *   - productName   -> item_name
 *   - categoryId    -> category_id
 *   - categoryPath  -> breadcrumb kategori (untuk display & audit)
 *   - brandId       -> brand.brand_id
 *   - description   -> description
 *   - attributes[]  -> attribute_list
 *
 * Seluruh field form membaca & menulis ke state ini — jangan
 * menyimpan salinan lokal per input.
 */

/** Nilai atribut kategori (mendukung teks bebas & pilihan referensi). */
export type ProductAttributeValue = {
  /** ID nilai atribut pada katalog marketplace (opsional untuk free-text). */
  valueId?: string | number;
  /** Representasi tampilan / kirim ke API. */
  value: string;
  /** Satuan untuk atribut numerik (mis. "cm", "kg"). */
  unit?: string;
};

/** Atribut kategori (dinamis, mengikuti kategori terpilih). */
export type ProductAttribute = {
  /** ID atribut dari marketplace. */
  attributeId: string | number;
  /** Nama atribut untuk display. */
  attributeName: string;
  /** Wajib diisi? (mengikuti definisi marketplace) */
  required?: boolean;
  /** Nilai — bisa lebih dari satu untuk atribut multi-select. */
  values: ProductAttributeValue[];
};

/** Segmen breadcrumb kategori (id + label). */
export type CategoryPathSegment = {
  id: string | number;
  name: string;
};

/** Bentuk kanonik informasi produk. */
export type ProductInformation = {
  productName: string;
  categoryId: string | number | null;
  categoryPath: CategoryPathSegment[];
  brandId: string | number | null;
  description: string;
  attributes: ProductAttribute[];
};

/** Nilai awal (kosong) untuk state ProductInformation. */
export const emptyProductInformation = (): ProductInformation => ({
  productName: "",
  categoryId: null,
  categoryPath: [],
  brandId: null,
  description: "",
  attributes: [],
});

/** Batas panjang teks (mengikuti aturan Shopee). */
export const PRODUCT_NAME_MAX_LENGTH = 120;
export const PRODUCT_DESCRIPTION_MAX_LENGTH = 3000;
