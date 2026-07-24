/**
 * Kontrak (interface) untuk layanan katalog produk.
 *
 * Tujuannya: hook & komponen bergantung pada **interface** ini, bukan pada
 * implementasi tertentu. Implementasi bisa berupa dummy in-memory hari ini,
 * atau Shopee Open API di kemudian hari — tanpa mengubah UI/business logic.
 *
 * Bentuk data mengikuti Shopee Open API agar pergantian implementasi
 * minim transformasi.
 */

// ---------------------------------------------------------------------------
// Category
// ---------------------------------------------------------------------------
export type ShopeeCategoryNode = {
  category_id: number;
  parent_category_id: number;
  original_category_name: string;
  display_category_name: string;
  has_children: boolean;
};

export type CategoryTreeNode = {
  id: number;
  name: string;
  children: CategoryTreeNode[];
};

export type CategoryOption = {
  id: number;
  name: string;
  path: { id: number; name: string }[];
  /** label siap tampil, contoh: "Fashion > Pakaian Pria > Kemeja". */
  label: string;
};

export interface ICategoryService {
  getCategoryTree(): Promise<CategoryTreeNode[]>;
  getCategoryOptions(): Promise<CategoryOption[]>;
}

// ---------------------------------------------------------------------------
// Brand
// ---------------------------------------------------------------------------
export type ShopeeBrand = {
  brand_id: number;
  original_brand_name: string;
  display_brand_name: string;
};

export interface IBrandService {
  /**
   * Ambil daftar brand untuk sebuah kategori.
   * Menerima seluruh breadcrumb agar implementasi bebas memilih root/leaf
   * mana yang dipakai untuk query.
   */
  getBrandsForCategory(
    categoryPath: { id: number | string; name: string }[],
  ): Promise<ShopeeBrand[]>;
}

// ---------------------------------------------------------------------------
// Attribute
// ---------------------------------------------------------------------------
export type ShopeeAttributeInputType =
  | "STRING_TYPE"
  | "INT_TYPE"
  | "FLOAT_TYPE"
  | "ENUM_TYPE"
  | "DATE_TYPE";

export type ShopeeAttributeValue = {
  value_id: number;
  original_value_name: string;
  display_value_name: string;
};

export type ShopeeAttribute = {
  attribute_id: number;
  original_attribute_name: string;
  display_attribute_name: string;
  is_mandatory: boolean;
  input_validation_type: ShopeeAttributeInputType;
  attribute_value_list: ShopeeAttributeValue[];
};

export interface IAttributeService {
  getAttributesForCategory(
    categoryPath: { id: number | string; name: string }[],
  ): Promise<ShopeeAttribute[]>;
}

// ---------------------------------------------------------------------------
// Registry (kumpulan seluruh layanan katalog).
// ---------------------------------------------------------------------------
export interface ICatalogServices {
  category: ICategoryService;
  brand: IBrandService;
  attribute: IAttributeService;
}
