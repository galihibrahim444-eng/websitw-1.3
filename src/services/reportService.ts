/**
 * ReportService — sumber data tunggal untuk modul Laporan
 * (Analisa Bisnis & Analisa Keuntungan).
 *
 * Saat ini implementasi membaca langsung dari store lokal (product,
 * pesanan, marketplace connection). Nantinya cukup mengganti isi
 * fungsi-fungsi di bawah dengan pemanggilan REST NestJS — signature
 * dan tipe hasil tetap sama sehingga UI tidak perlu berubah.
 */

import type { PesananRow, Marketplace } from "@/data/pesanan";
import type { StoredProduct } from "@/lib/product-store";
import type { MarketplaceConnectionDetail } from "@/services/marketplaceConnectionService";

export type ReportPeriod = "harian" | "mingguan" | "bulanan" | "tahunan";

export interface ReportFilter {
  marketplace?: string; // "all" | Marketplace
  gudang?: string; // "all" | id gudang (belum ada — placeholder)
  kategori?: string; // "all" | nama kategori
  productId?: string; // "all" | id produk ERP
  from?: string; // YYYY-MM-DD
  to?: string; // YYYY-MM-DD
}

export interface ReportContext {
  products: StoredProduct[];
  orders: PesananRow[];
  connections: MarketplaceConnectionDetail[];
}

export interface BusinessKPI {
  jumlahPesanan: number;
  produkTerjual: number;
  omzet: number;
  produkAktif: number;
  skuAktif: number;
  rataNilaiOrder: number;
}

export interface PotonganBreakdown {
  voucherStore: number;
  voucherMarketplace: number;
  campaignDiscount: number;
  total: number;
}

export interface BiayaBreakdown {
  adminFee: number;
  serviceFee: number;
  shippingSubsidy: number;
  codFee: number;
  affiliateFee: number;
  adsFee: number;
  total: number;
}

export interface ProfitKPI {
  totalOmzet: number;
  potonganMarketplace: number; // Total Potongan (voucher + diskon)
  biayaAdmin: number;          // Total Biaya (admin + layanan + cod + affiliate + iklan + gratis ongkir)
  totalHpp: number;
  labaKotor: number;           // Omzet - HPP
  labaBersih: number;          // Pendapatan Bersih - HPP
  pendapatanBersih: number;    // Omzet - Potongan - Biaya
  potongan: PotonganBreakdown;
  biaya: BiayaBreakdown;
}

export interface TrendPoint {
  bucket: string; // label sumbu-X
  omzet: number;
  pesanan: number;
  profit: number;
}

export interface TopProductRow {
  sku: string;
  name: string;
  qty: number;
  omzet: number;
  sisaStock: number;
}

export interface ProfitProductRow {
  sku: string;
  name: string;
  qty: number;
  hargaJual: number;
  hpp: number;
  omzet: number;
  profit: number;
}

export interface MarketplaceSummaryRow {
  marketplace: Marketplace;
  jumlahPesanan: number;
  produkTerjual: number;
  omzet: number;
}

export interface MarketplaceProfitRow {
  marketplace: Marketplace;
  omzet: number;
  fee: number;
  profit: number;
}

/**
 * DTO transaksi profit — bentuknya sengaja disamakan dengan payload yang
 * nantinya dikirim backend NestJS / Shopee Open API (settlement API).
 */
export interface ProfitTransactionRow {
  orderId: string;
  createdAt: string; // ISO date
  marketplace: Marketplace;
  productName: string;
  sellingPrice: number;
  hpp: number;
  voucherStore: number;
  voucherMarketplace: number;
  campaignDiscount: number;
  adminFee: number;
  serviceFee: number;
  shippingSubsidy: number;
  codFee: number;
  affiliateFee: number;
  adsFee: number;
  potongan: number;   // voucher + diskon
  biaya: number;      // admin + layanan + gratis ongkir + cod + affiliate + iklan
  netRevenue: number; // pendapatan bersih
  grossProfit: number;// omzet - hpp
  netProfit: number;  // netRevenue - hpp
}

// -------------------------------------------------------------------
// Helper: rasio fee marketplace (placeholder — akan diganti oleh data
// riil dari backend saat withdraw/settlement API tersedia).
// Sengaja di-set 0 agar tidak menampilkan angka dummy.
// -------------------------------------------------------------------
export const MARKETPLACE_FEE_RATE: Record<string, number> = {
  Shopee: 0,
  Tokopedia: 0,
  "TikTok Shop": 0,
  Lazada: 0,
};

const ADMIN_FEE_PER_ORDER = 0; // placeholder sampai backend menyediakan

// -------------------------------------------------------------------
// Filtering primitives
// -------------------------------------------------------------------
function withinDate(dateISO: string, from?: string, to?: string) {
  if (from && dateISO < from) return false;
  if (to && dateISO > to) return false;
  return true;
}

function filterOrders(orders: PesananRow[], products: StoredProduct[], f: ReportFilter): PesananRow[] {
  const productById = new Map(products.map((p) => [p.id, p]));
  const productBySku = new Map(products.map((p) => [p.skuInduk, p]));
  return orders.filter((o) => {
    if (o.status === "Dibatalkan") return false;
    if (f.marketplace && f.marketplace !== "all" && o.marketplace !== f.marketplace) return false;
    if (!withinDate(o.date, f.from, f.to)) return false;
    if (f.kategori && f.kategori !== "all") {
      const p = productBySku.get(o.masterSku);
      if (!p || p.kategori !== f.kategori) return false;
    }
    if (f.productId && f.productId !== "all") {
      const target = productById.get(f.productId);
      if (!target) return false;
      if (target.skuInduk !== o.masterSku) return false;
    }
    return true;
  });
}

function filterProducts(products: StoredProduct[], f: ReportFilter): StoredProduct[] {
  return products.filter((p) => {
    if (p.status !== "live") return false;
    if (f.kategori && f.kategori !== "all" && p.kategori !== f.kategori) return false;
    if (f.productId && f.productId !== "all" && p.id !== f.productId) return false;
    if (f.marketplace && f.marketplace !== "all" && p.marketplace !== f.marketplace) return false;
    return true;
  });
}

function priceOf(p?: StoredProduct): number {
  if (!p) return 0;
  return p.sellingPrice ?? p.harga ?? 0;
}
function hppOf(p?: StoredProduct): number {
  if (!p) return 0;
  return p.hpp ?? 0;
}
function stockOf(p?: StoredProduct): number {
  if (!p) return 0;
  if (p.variants && p.variants.length > 0) {
    return p.variants.reduce((s, v) => s + (v.stok ?? 0), 0);
  }
  return p.stok ?? 0;
}

// -------------------------------------------------------------------
// Public API
// -------------------------------------------------------------------
export const reportService = {
  getBusinessKPI(ctx: ReportContext, filter: ReportFilter): BusinessKPI {
    const orders = filterOrders(ctx.orders, ctx.products, filter);
    const liveProducts = filterProducts(ctx.products, filter);
    const jumlahPesanan = orders.length;
    const produkTerjual = orders.length; // 1 order = 1 unit (sampai backend qty tersedia)
    const omzet = orders.reduce((s, o) => s + (o.total || 0), 0);
    const produkAktif = liveProducts.length;
    const skuAktif = liveProducts.reduce((s, p) => s + (p.variants?.length || 1), 0);
    const rataNilaiOrder = jumlahPesanan > 0 ? omzet / jumlahPesanan : 0;
    return { jumlahPesanan, produkTerjual, omzet, produkAktif, skuAktif, rataNilaiOrder };
  },

  /**
   * Bangun DTO transaksi profit per pesanan. Perhitungan mengikuti standar:
   *   Pendapatan Bersih = Harga Jual − Voucher Toko − Voucher Marketplace
   *                       − Diskon Campaign − Biaya Admin − Biaya Layanan
   *                       − Gratis Ongkir − COD − Affiliate − Iklan
   *   Laba Kotor        = Harga Jual − HPP
   *   Laba Bersih       = Pendapatan Bersih − HPP
   */
  getProfitTransactions(ctx: ReportContext, filter: ReportFilter): ProfitTransactionRow[] {
    const orders = filterOrders(ctx.orders, ctx.products, filter);
    const productBySku = new Map(ctx.products.map((p) => [p.skuInduk, p]));
    return orders.map((o) => {
      const p = productBySku.get(o.masterSku);
      const sellingPrice = o.total || 0;
      const hpp = hppOf(p);
      const voucherStore = o.voucherStore ?? 0;
      const voucherMarketplace = o.voucherMarketplace ?? 0;
      const campaignDiscount = o.campaignDiscount ?? 0;
      const adminFee = o.adminFee ?? 0;
      const serviceFee = o.serviceFee ?? 0;
      const shippingSubsidy = o.shippingSubsidy ?? 0;
      const codFee = o.codFee ?? 0;
      const affiliateFee = o.affiliateFee ?? 0;
      const adsFee = o.adsFee ?? 0;
      const potongan = voucherStore + voucherMarketplace + campaignDiscount;
      const biaya =
        adminFee + serviceFee + shippingSubsidy + codFee + affiliateFee + adsFee;
      const netRevenue = sellingPrice - potongan - biaya;
      const grossProfit = sellingPrice - hpp;
      const netProfit = netRevenue - hpp;
      return {
        orderId: o.id,
        createdAt: o.date,
        marketplace: o.marketplace,
        productName: o.productName,
        sellingPrice,
        hpp,
        voucherStore,
        voucherMarketplace,
        campaignDiscount,
        adminFee,
        serviceFee,
        shippingSubsidy,
        codFee,
        affiliateFee,
        adsFee,
        potongan,
        biaya,
        netRevenue,
        grossProfit,
        netProfit,
      };
    });
  },

  getProfitKPI(ctx: ReportContext, filter: ReportFilter): ProfitKPI {
    const txs = this.getProfitTransactions(ctx, filter);
    const potongan: PotonganBreakdown = {
      voucherStore: 0,
      voucherMarketplace: 0,
      campaignDiscount: 0,
      total: 0,
    };
    const biaya: BiayaBreakdown = {
      adminFee: 0,
      serviceFee: 0,
      shippingSubsidy: 0,
      codFee: 0,
      affiliateFee: 0,
      adsFee: 0,
      total: 0,
    };
    let totalOmzet = 0;
    let totalHpp = 0;
    let pendapatanBersih = 0;
    for (const t of txs) {
      totalOmzet += t.sellingPrice;
      totalHpp += t.hpp;
      pendapatanBersih += t.netRevenue;
      potongan.voucherStore += t.voucherStore;
      potongan.voucherMarketplace += t.voucherMarketplace;
      potongan.campaignDiscount += t.campaignDiscount;
      biaya.adminFee += t.adminFee;
      biaya.serviceFee += t.serviceFee;
      biaya.shippingSubsidy += t.shippingSubsidy;
      biaya.codFee += t.codFee;
      biaya.affiliateFee += t.affiliateFee;
      biaya.adsFee += t.adsFee;
    }
    potongan.total =
      potongan.voucherStore + potongan.voucherMarketplace + potongan.campaignDiscount;
    biaya.total =
      biaya.adminFee +
      biaya.serviceFee +
      biaya.shippingSubsidy +
      biaya.codFee +
      biaya.affiliateFee +
      biaya.adsFee;
    const labaKotor = totalOmzet - totalHpp;
    const labaBersih = pendapatanBersih - totalHpp;
    return {
      totalOmzet,
      potonganMarketplace: potongan.total,
      biayaAdmin: biaya.total,
      totalHpp,
      labaKotor,
      labaBersih,
      pendapatanBersih,
      potongan,
      biaya,
    };
  },

  getTrend(ctx: ReportContext, filter: ReportFilter, period: ReportPeriod): TrendPoint[] {
    const txs = this.getProfitTransactions(ctx, filter);
    const buckets = new Map<string, TrendPoint>();
    for (const t of txs) {
      const d = new Date(t.createdAt);
      let key: string;
      let label: string;
      if (period === "harian") {
        key = t.createdAt;
        label = d.toLocaleDateString("id-ID", { day: "2-digit", month: "short" });
      } else if (period === "mingguan") {
        const week = getIsoWeek(d);
        key = `${d.getFullYear()}-W${week.toString().padStart(2, "0")}`;
        label = `M${week} ${d.getFullYear()}`;
      } else if (period === "bulanan") {
        key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}`;
        label = d.toLocaleDateString("id-ID", { month: "short", year: "numeric" });
      } else {
        key = `${d.getFullYear()}`;
        label = key;
      }
      const cur = buckets.get(key) ?? { bucket: label, omzet: 0, pesanan: 0, profit: 0 };
      cur.omzet += t.sellingPrice;
      cur.pesanan += 1;
      cur.profit += t.netProfit;
      buckets.set(key, cur);
    }
    return [...buckets.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, v]) => v);
  },

  getTopProducts(ctx: ReportContext, filter: ReportFilter, limit = 10): TopProductRow[] {
    const orders = filterOrders(ctx.orders, ctx.products, filter);
    const productBySku = new Map(ctx.products.map((p) => [p.skuInduk, p]));
    const agg = new Map<string, TopProductRow>();
    for (const o of orders) {
      const cur = agg.get(o.masterSku) ?? {
        sku: o.masterSku,
        name: o.productName,
        qty: 0,
        omzet: 0,
        sisaStock: stockOf(productBySku.get(o.masterSku)),
      };
      cur.qty += 1;
      cur.omzet += o.total || 0;
      agg.set(o.masterSku, cur);
    }
    return [...agg.values()].sort((a, b) => b.qty - a.qty).slice(0, limit);
  },

  getProfitPerProduct(ctx: ReportContext, filter: ReportFilter, limit = 10): ProfitProductRow[] {
    const txs = this.getProfitTransactions(ctx, filter);
    const productBySku = new Map(ctx.products.map((p) => [p.skuInduk, p]));
    const bySku = new Map<string, { name: string; qty: number; omzet: number; profit: number; hpp: number; hargaJual: number; sku: string }>();
    // gunakan masterSku dari order asli via lookup ulang
    const orders = filterOrders(ctx.orders, ctx.products, filter);
    orders.forEach((o, i) => {
      const t = txs[i];
      const p = productBySku.get(o.masterSku);
      const cur =
        bySku.get(o.masterSku) ??
        {
          sku: o.masterSku,
          name: o.productName,
          qty: 0,
          hargaJual: priceOf(p),
          hpp: hppOf(p),
          omzet: 0,
          profit: 0,
        };
      cur.qty += 1;
      cur.omzet += t.sellingPrice;
      cur.profit += t.netProfit;
      bySku.set(o.masterSku, cur);
    });
    return [...bySku.values()].sort((a, b) => b.profit - a.profit).slice(0, limit);
  },

  getMarketplaceSummary(ctx: ReportContext, filter: ReportFilter): MarketplaceSummaryRow[] {
    const orders = filterOrders(ctx.orders, ctx.products, filter);
    const agg = new Map<Marketplace, MarketplaceSummaryRow>();
    for (const o of orders) {
      const cur =
        agg.get(o.marketplace) ??
        { marketplace: o.marketplace, jumlahPesanan: 0, produkTerjual: 0, omzet: 0 };
      cur.jumlahPesanan += 1;
      cur.produkTerjual += 1;
      cur.omzet += o.total || 0;
      agg.set(o.marketplace, cur);
    }
    for (const c of ctx.connections) {
      if (!agg.has(c.marketplace as Marketplace)) {
        agg.set(c.marketplace as Marketplace, {
          marketplace: c.marketplace as Marketplace,
          jumlahPesanan: 0,
          produkTerjual: 0,
          omzet: 0,
        });
      }
    }
    return [...agg.values()];
  },

  getMarketplaceProfit(ctx: ReportContext, filter: ReportFilter): MarketplaceProfitRow[] {
    const txs = this.getProfitTransactions(ctx, filter);
    const agg = new Map<Marketplace, MarketplaceProfitRow>();
    for (const t of txs) {
      const cur =
        agg.get(t.marketplace) ??
        { marketplace: t.marketplace, omzet: 0, fee: 0, profit: 0 };
      cur.omzet += t.sellingPrice;
      cur.fee += t.potongan + t.biaya;
      cur.profit += t.netProfit;
      agg.set(t.marketplace, cur);
    }
    for (const c of ctx.connections) {
      if (!agg.has(c.marketplace as Marketplace)) {
        agg.set(c.marketplace as Marketplace, {
          marketplace: c.marketplace as Marketplace,
          omzet: 0,
          fee: 0,
          profit: 0,
        });
      }
    }
    return [...agg.values()];
  },
};

function getIsoWeek(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}
