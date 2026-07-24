/**
 * Implementasi dummy `IAttributeService`.
 *
 * Bentuk mengikuti Shopee `/product/get_attributes`. Ganti implementasi
 * ini dengan varian Shopee bila sudah siap — konsumen tidak berubah.
 */

import type { IAttributeService, ShopeeAttribute } from "./types";

const DUMMY_ATTRIBUTES_BY_CATEGORY: Record<number, ShopeeAttribute[]> = {
  // Fashion (root 100)
  100: [
    {
      attribute_id: 10001,
      original_attribute_name: "Color",
      display_attribute_name: "Warna",
      is_mandatory: true,
      input_validation_type: "ENUM_TYPE",
      attribute_value_list: [
        { value_id: 1, original_value_name: "Black", display_value_name: "Hitam" },
        { value_id: 2, original_value_name: "White", display_value_name: "Putih" },
        { value_id: 3, original_value_name: "Navy",  display_value_name: "Navy"  },
      ],
    },
    {
      attribute_id: 10002,
      original_attribute_name: "Size",
      display_attribute_name: "Ukuran",
      is_mandatory: true,
      input_validation_type: "ENUM_TYPE",
      attribute_value_list: [
        { value_id: 10, original_value_name: "S",  display_value_name: "S"  },
        { value_id: 11, original_value_name: "M",  display_value_name: "M"  },
        { value_id: 12, original_value_name: "L",  display_value_name: "L"  },
        { value_id: 13, original_value_name: "XL", display_value_name: "XL" },
      ],
    },
    {
      attribute_id: 10003,
      original_attribute_name: "Material",
      display_attribute_name: "Bahan",
      is_mandatory: false,
      input_validation_type: "STRING_TYPE",
      attribute_value_list: [],
    },
    {
      attribute_id: 10004,
      original_attribute_name: "Sleeve Type",
      display_attribute_name: "Jenis Lengan",
      is_mandatory: false,
      input_validation_type: "ENUM_TYPE",
      attribute_value_list: [
        { value_id: 20, original_value_name: "Short Sleeve", display_value_name: "Lengan Pendek" },
        { value_id: 21, original_value_name: "Long Sleeve",  display_value_name: "Lengan Panjang" },
      ],
    },
  ],
  // Handphone (leaf 201)
  201: [
    {
      attribute_id: 20001,
      original_attribute_name: "RAM",
      display_attribute_name: "RAM",
      is_mandatory: true,
      input_validation_type: "ENUM_TYPE",
      attribute_value_list: [
        { value_id: 30, original_value_name: "4GB",  display_value_name: "4 GB"  },
        { value_id: 31, original_value_name: "6GB",  display_value_name: "6 GB"  },
        { value_id: 32, original_value_name: "8GB",  display_value_name: "8 GB"  },
        { value_id: 33, original_value_name: "12GB", display_value_name: "12 GB" },
      ],
    },
    {
      attribute_id: 20002,
      original_attribute_name: "ROM",
      display_attribute_name: "ROM",
      is_mandatory: true,
      input_validation_type: "ENUM_TYPE",
      attribute_value_list: [
        { value_id: 40, original_value_name: "64GB",  display_value_name: "64 GB"  },
        { value_id: 41, original_value_name: "128GB", display_value_name: "128 GB" },
        { value_id: 42, original_value_name: "256GB", display_value_name: "256 GB" },
        { value_id: 43, original_value_name: "512GB", display_value_name: "512 GB" },
      ],
    },
    {
      attribute_id: 20003,
      original_attribute_name: "IMEI",
      display_attribute_name: "IMEI",
      is_mandatory: false,
      input_validation_type: "STRING_TYPE",
      attribute_value_list: [],
    },
    {
      attribute_id: 20004,
      original_attribute_name: "Chipset",
      display_attribute_name: "Chipset",
      is_mandatory: false,
      input_validation_type: "STRING_TYPE",
      attribute_value_list: [],
    },
    {
      attribute_id: 20005,
      original_attribute_name: "Warranty",
      display_attribute_name: "Garansi",
      is_mandatory: false,
      input_validation_type: "ENUM_TYPE",
      attribute_value_list: [
        { value_id: 50, original_value_name: "Resmi",            display_value_name: "Garansi Resmi" },
        { value_id: 51, original_value_name: "Distributor",      display_value_name: "Garansi Distributor" },
        { value_id: 52, original_value_name: "Toko",             display_value_name: "Garansi Toko" },
        { value_id: 53, original_value_name: "Tidak Bergaransi", display_value_name: "Tidak Bergaransi" },
      ],
    },
  ],
};

export const dummyAttributeService: IAttributeService = {
  async getAttributesForCategory(categoryPath) {
    if (!categoryPath.length) return [];
    for (let i = categoryPath.length - 1; i >= 0; i--) {
      const id = Number(categoryPath[i].id);
      const hit = DUMMY_ATTRIBUTES_BY_CATEGORY[id];
      if (hit) return hit;
    }
    return [];
  },
};
