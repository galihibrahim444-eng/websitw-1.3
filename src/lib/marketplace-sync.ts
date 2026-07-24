import { pesananStore } from "@/lib/pesanan-store";
import type { PesananStatus } from "@/data/pesanan";

// =============================================================================
// Marketplace Status Sync (pondasi arsitektur)
// =============================================================================
// Modul ini adalah SATU-SATUNYA jalur masuk untuk perubahan status pesanan yang
// berasal dari marketplace (Shopee, Tokopedia, TikTok Shop, Lazada, dll).
//
// Tujuan:
// - Menjaga agar status ERP tidak tertinggal jika operator lupa klik "Proses"
//   atau "Cetak", padahal marketplace sudah melaporkan pesanan SHIPPED.
// - Menyediakan satu titik integrasi. Nanti saat API marketplace dihubungkan,
//   webhook / poller cukup memanggil `handleMarketplaceStatusUpdate(...)`
//   tanpa perlu mengubah halaman-halaman modul Pesanan.
// - Semua mutasi tetap melewati `pesananStore.updateStatus()` sehingga seluruh
//   halaman yang berlangganan store langsung tersinkron.
//
// Catatan: BELUM ada pemanggilan API di sini. Ini murni pondasi logika ERP.
// =============================================================================

/**
 * Status normal dari sisi marketplace. Sengaja dibuat generik agar setiap
 * adapter marketplace (Shopee/Tokopedia/TikTok/Lazada) memetakan istilah
 * internal mereka (mis. "READY_TO_SHIP", "IN_TRANSIT") ke enum ini SEBELUM
 * memanggil `handleMarketplaceStatusUpdate`.
 */
export type MarketplaceStatus =
  | "PENDING"       // baru masuk, marketplace masih memproses
  | "READY_TO_SHIP" // sudah siap dicetak/pickup
  | "SHIPPED"       // sudah diserahkan ke kurir / in-transit
  | "DELIVERED"     // sampai ke pembeli
  | "CANCELLED";    // dibatalkan

export type MarketplaceSyncResult =
  | { ok: true; orderId: string; from: PesananStatus; to: PesananStatus; transitions: PesananStatus[] }
  | { ok: false; orderId: string; reason: "not_found" | "no_change" | "terminal" | "unsupported" };

// Urutan progres normal di ERP. Digunakan untuk "menyusul" status yang
// ketinggalan (mis. dari Menunggu Dicetak langsung ke Dikirim harus melewati
// Menunggu Pickup, sehingga jejak transisi tetap konsisten).
const FORWARD_ORDER: PesananStatus[] = [
  "Diproses Marketplace",
  "Menunggu Diproses",
  "Menunggu Dicetak",
  "Menunggu Pickup",
  "Dikirim",
  "Selesai",
];

const TERMINAL: PesananStatus[] = ["Selesai", "Dibatalkan"];

/**
 * Pemetaan status marketplace → status ERP target.
 * Ini adalah "state tujuan" yang diinginkan marketplace. Fungsi utama akan
 * memutuskan apakah perlu menaikkan status ERP untuk menyamai target ini.
 */
function mapMarketplaceToErp(status: MarketplaceStatus): PesananStatus | null {
  switch (status) {
    case "PENDING":        return "Diproses Marketplace";
    case "READY_TO_SHIP":  return "Menunggu Dicetak";
    case "SHIPPED":        return "Dikirim";
    case "DELIVERED":      return "Selesai";
    case "CANCELLED":      return "Dibatalkan";
    default:               return null;
  }
}

/**
 * Fungsi terpusat untuk menerima update status dari marketplace.
 *
 * Aturan:
 *  1. Jika pesanan tidak ditemukan → `not_found`.
 *  2. Jika status ERP sudah terminal (Dikirim / Selesai / Dibatalkan) → jangan
 *     diproses ulang (`terminal`).
 *  3. Jika target sama dengan status sekarang → `no_change`.
 *  4. Jika marketplace melaporkan status yang LEBIH MAJU dari ERP (mis.
 *     SHIPPED sedangkan ERP masih "Menunggu Dicetak"/"Menunggu Pickup"),
 *     sistem otomatis menaikkan status melewati tahap-tahap antaranya
 *     (Menunggu Dicetak → Menunggu Pickup → Dikirim) tanpa perlu klik
 *     operator. Semua transisi tetap melalui `pesananStore.updateStatus()`.
 *  5. Pembatalan dari marketplace langsung memindahkan status ke "Dibatalkan".
 */
export function handleMarketplaceStatusUpdate(
  orderId: string,
  marketplaceStatus: MarketplaceStatus,
): MarketplaceSyncResult {
  const order = pesananStore.getAll().find((r) => r.id === orderId);
  if (!order) return { ok: false, orderId, reason: "not_found" };

  const target = mapMarketplaceToErp(marketplaceStatus);
  if (!target) return { ok: false, orderId, reason: "unsupported" };

  const current = order.status;

  // Pembatalan bersifat absolut kecuali sudah selesai/terkirim.
  if (target === "Dibatalkan") {
    if (current === "Selesai" || current === "Dikirim" || current === "Dibatalkan") {
      return { ok: false, orderId, reason: "terminal" };
    }
    pesananStore.updateStatus([orderId], "Dibatalkan");
    return { ok: true, orderId, from: current, to: "Dibatalkan", transitions: ["Dibatalkan"] };
  }

  if (TERMINAL.includes(current)) {
    return { ok: false, orderId, reason: "terminal" };
  }

  if (current === target) {
    return { ok: false, orderId, reason: "no_change" };
  }

  const curIdx = FORWARD_ORDER.indexOf(current);
  const tgtIdx = FORWARD_ORDER.indexOf(target);

  // Marketplace hanya boleh menggerakkan status maju. Update mundur diabaikan
  // agar aksi operator (yang sudah lebih akurat) tidak tertimpa.
  if (curIdx === -1 || tgtIdx === -1 || tgtIdx <= curIdx) {
    return { ok: false, orderId, reason: "no_change" };
  }

  // Terapkan transisi bertahap: setiap tahap tetap lewat updateStatus() supaya
  // semua subscriber store menerima perubahan secara konsisten.
  const transitions = FORWARD_ORDER.slice(curIdx + 1, tgtIdx + 1);
  for (const next of transitions) {
    pesananStore.updateStatus([orderId], next);
  }

  return { ok: true, orderId, from: current, to: target, transitions };
}

/**
 * Helper batch — sebagian marketplace mengirim banyak update sekaligus.
 * Nanti webhook cukup memanggil ini alih-alih looping manual.
 */
export function handleMarketplaceStatusUpdates(
  updates: Array<{ orderId: string; status: MarketplaceStatus }>,
): MarketplaceSyncResult[] {
  return updates.map((u) => handleMarketplaceStatusUpdate(u.orderId, u.status));
}
