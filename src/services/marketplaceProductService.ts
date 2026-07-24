/**
 * MarketplaceProductService
 *
 * Sumber daftar produk marketplace untuk halaman "Hubungkan Mapping".
 *
 * Sementara Shopee Open API belum aktif, sumber data diambil dari
 * Master Produk ERP (productStore). Ketika API marketplace sudah siap,
 * cukup ganti implementasi `list()` dengan pemanggilan endpoint
 * `get_item_list` + `get_item_base_info` — bentuk `MarketplaceProduct`
 * sudah dirancang selaras dengan field yang dikembalikan API tersebut.
 */
import type { MarketplaceName } from "./marketplaceAccountService";
import { MarketplaceAccountService } from "./marketplaceAccountService";
import { productStore, type StoredProduct } from "@/lib/product-store";

export interface MarketplaceProduct {
  /** item_id di marketplace */
  itemId: string;
  marketplace: MarketplaceName;
  shopId: number;
  shopName: string;
  name: string;
  image?: string;
  /** SKU ID marketplace (model_id / variation id) */
  skuId: string;
  /** Nilai variasi terformat, contoh "Putih, L" */
  variation?: string;
  /** SKU/model_sku yang di-set di marketplace */
  marketplaceSku: string;
}

export interface ListParams {
  marketplace: MarketplaceName;
  shopId?: number;
  search?: string;
}

/**
 * Bangun daftar produk marketplace dari Master Produk ERP.
 * Untuk sementara setiap SKU ERP direpresentasikan sebagai satu
 * baris marketplace dengan SKU marketplace = SKU ERP.
 */
function buildFromErp(
  products: StoredProduct[],
  marketplace: MarketplaceName,
  shopId: number,
  shopName: string,
): MarketplaceProduct[] {
  const out: MarketplaceProduct[] = [];
  products
    .filter((p) => p.status !== "archive")
    .forEach((p) => {
      const itemId = p.id;
      if (p.variants && p.variants.length > 0) {
        p.variants.forEach((v, idx) => {
          const sku = v.sku || `${p.skuInduk}-${idx + 1}`;
          out.push({
            itemId,
            marketplace,
            shopId,
            shopName,
            name: p.namaProduk,
            image: v.gambar ?? p.fotoCover ?? undefined,
            skuId: `${itemId}-${idx + 1}`,
            variation: v.sku && v.sku !== p.skuInduk ? v.sku : undefined,
            marketplaceSku: sku,
          });
        });
      } else {
        out.push({
          itemId,
          marketplace,
          shopId,
          shopName,
          name: p.namaProduk,
          image: p.fotoCover ?? undefined,
          skuId: `${itemId}-1`,
          marketplaceSku: p.skuInduk,
        });
      }
    });
  return out;
}

export const MarketplaceProductService = {
  async list(params: ListParams): Promise<MarketplaceProduct[]> {
    const shops = await MarketplaceAccountService.getConnectedShops(
      params.marketplace,
    );
    if (shops.length === 0) return [];

    const targetShops = params.shopId
      ? shops.filter((s) => s.shopId === params.shopId)
      : shops;
    if (targetShops.length === 0) return [];

    // Gunakan toko pertama sebagai sumber "sinkronisasi" agar tidak
    // menduplikasi produk lintas toko. Saat Shopee API aktif, panggilan
    // akan dilakukan per shopId dan hasilnya digabungkan di sini.
    const shop = targetShops[0];
    const items = buildFromErp(
      productStore.getAll(),
      params.marketplace,
      shop.shopId,
      shop.shopName,
    );

    const q = params.search?.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.marketplaceSku.toLowerCase().includes(q) ||
        p.skuId.toLowerCase().includes(q) ||
        p.itemId.toLowerCase().includes(q),
    );
  },
};
