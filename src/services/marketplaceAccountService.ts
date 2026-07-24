/**
 * MarketplaceAccountService
 *
 * Abstraksi untuk mendapatkan daftar akun/toko marketplace yang terhubung.
 * Saat ini mengembalikan data dummy. Di masa depan, isi fungsi ini bisa
 * diganti dengan pemanggilan ke database internal atau ke Shopee/Tokopedia/
 * TikTok Shop/Lazada Open API tanpa perlu mengubah komponen UI yang
 * mengonsumsinya.
 */

export type MarketplaceName =
  | "Shopee"
  | "Tokopedia"
  | "TikTok Shop"
  | "Lazada";

export type MarketplaceAccountStatus = "Connected" | "Disconnected" | "Expired";

export interface MarketplaceAccount {
  id: number;
  marketplace: MarketplaceName;
  shopId: number;
  merchantId: number;
  shopName: string;
  status: MarketplaceAccountStatus;
}

// ---------------------------------------------------------------------------
// Dummy data source (akan diganti dengan API/DB call di masa depan)
// ---------------------------------------------------------------------------
const dummyAccounts: MarketplaceAccount[] = [
  {
    id: 1,
    marketplace: "Shopee",
    shopId: 123456789,
    merchantId: 99887766,
    shopName: "Maqil Fashion Store",
    status: "Connected",
  },
  {
    id: 2,
    marketplace: "Shopee",
    shopId: 987654321,
    merchantId: 99887766,
    shopName: "Maqil Official",
    status: "Connected",
  },
];

// Status koneksi per-marketplace. Sumber ini dummy; nanti diganti hasil
// query ke DB / OAuth status marketplace tanpa mengubah signature.
export interface MarketplaceConnection {
  marketplace: MarketplaceName;
  connected: boolean;
}

const dummyMarketplaceConnections: MarketplaceConnection[] = [
  { marketplace: "Shopee", connected: true },
  { marketplace: "Tokopedia", connected: false },
  { marketplace: "TikTok Shop", connected: false },
  { marketplace: "Lazada", connected: false },
];

export const MarketplaceAccountService = {
  /**
   * Ambil daftar toko yang terhubung untuk satu marketplace tertentu.
   * TODO: ganti isi fungsi ini dengan pemanggilan ke Shopee Open API /
   * database internal ketika integrasi sudah siap. Signature-nya tidak
   * perlu berubah agar halaman Tambah Produk tetap kompatibel.
   */
  async getConnectedShops(
    marketplace: MarketplaceName,
  ): Promise<MarketplaceAccount[]> {
    return dummyAccounts.filter(
      (account) =>
        account.marketplace === marketplace && account.status === "Connected",
    );
  },

  /**
   * Ambil satu toko berdasarkan shopId.
   */
  async getShopById(shopId: number): Promise<MarketplaceAccount | null> {
    return dummyAccounts.find((account) => account.shopId === shopId) ?? null;
  },

  /**
   * Ambil daftar marketplace beserta status koneksinya. Komponen UI memakai
   * ini untuk merender tab marketplace secara dinamis.
   */
  async getConnectedMarketplaces(): Promise<MarketplaceConnection[]> {
    return dummyMarketplaceConnections;
  },

  /**
   * Ambil seluruh toko yang berstatus Connected lintas marketplace.
   * Dipakai fitur "Salin Produk ke Toko Lain" untuk menampilkan daftar
   * toko tujuan pada dialog.
   */
  async getAllConnectedShops(): Promise<MarketplaceAccount[]> {
    return dummyAccounts.filter((a) => a.status === "Connected");
  },
};
