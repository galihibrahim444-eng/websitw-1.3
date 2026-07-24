import { masterProducts } from "./products";

export type Marketplace = "Shopee" | "Tokopedia" | "TikTok Shop" | "Lazada";
export type Kurir = "JNE" | "J&T" | "SiCepat" | "AnterAja" | "Ninja Xpress";

export type PesananStatus =
  | "Menunggu Dicetak"
  | "Menunggu Pickup"
  | "Menunggu Diproses"
  | "Dikirim"
  | "Selesai"
  | "Dibatalkan"
  | "Diproses Marketplace";

export type PesananRow = {
  id: string;
  // nomor resi pengiriman yang akan digunakan untuk Scan & Kirim
  resi?: string;
  buyer: string;
  marketplace: Marketplace;
  store: string;
  kurir: Kurir;
  total: number;
  date: string; // YYYY-MM-DD
  productName: string;
  masterSku: string;
  imageUrl: string;
  status: PesananStatus;
  printCount: number;
  // Field opsional untuk breakdown finansial (akan diisi oleh Shopee Open
  // API / backend NestJS saat settlement tersedia). Default 0 bila kosong.
  voucherStore?: number;
  voucherMarketplace?: number;
  campaignDiscount?: number;
  adminFee?: number;
  serviceFee?: number;
  shippingSubsidy?: number;
  codFee?: number;
  affiliateFee?: number;
  adsFee?: number;
};

const buyers = [
  "Andi Saputra", "Rina Kartika", "Budi Wibowo", "Sinta Dewi", "Doni Prasetyo",
  "Maya Anggraini", "Fajar Hidayat", "Nadia Putri", "Rizky Ramadhan", "Tania Lestari",
  "Bagus Wicaksono", "Wulan Sari", "Hendra Gunawan", "Ayu Pratiwi", "Reza Firmansyah",
  "Dewi Ratnasari", "Adit Nugroho", "Salsa Amelia", "Yusuf Maulana", "Citra Ningsih",
  "Rangga Aditya", "Melati Kusuma", "Ilham Pratama", "Kirana Ayu", "Bima Sakti",
];

const marketplaces: Marketplace[] = ["Shopee", "Tokopedia", "TikTok Shop", "Lazada"];
const stores = ["Maqil Official Store", "Maqil Fashion", "Maqil Sport", "Maqil Outdoor"];
const kurirs: Kurir[] = ["JNE", "J&T", "SiCepat", "AnterAja", "Ninja Xpress"];

export const pesananSample: PesananRow[] = buyers.map((buyer, i) => {
  const p = masterProducts[i % masterProducts.length];
  const status: PesananStatus =
    i % 4 === 0
      ? "Menunggu Dicetak"
      : i % 4 === 1
      ? "Menunggu Pickup"
      : i % 4 === 2
      ? "Menunggu Diproses"
      : "Dikirim";

  return {
    id: `INV-2607${String(180 + i).padStart(4, "0")}`,
    // mock nomor resi; dipertahankan sebagai properti baru selain `id`
    resi: `TRK${String(100000 + i)}`,
    buyer,
    marketplace: marketplaces[i % marketplaces.length],
    store: stores[i % stores.length],
    kurir: kurirs[i % kurirs.length],
    total: 50000 + ((i * 37) % 20) * 25000,
    date: `2026-07-${String(20 - (i % 18)).padStart(2, "0")}`,
    productName: p.name,
    masterSku: p.masterSku,
    imageUrl: p.imageUrl,
    status,
    printCount: 0,
  };
});
