import { masterProducts } from "@/data/products";
import { pesananSample } from "@/data/pesanan";

export type DashboardData = {
  totalProducts: number;
  totalMasterSkus: number;
  totalUnmappedSkus: number;
  totalOrdersToday: number;
  ordersPendingProcessing: number;
  ordersPendingPickup: number;
  totalWarehouseStock: number;
  skusLowStock: number;
  activeMarketplaces: number;
  marketplaceList: readonly string[];
  lastSyncAt: string;
};

const MARKETPLACE_LIST = ["Shopee", "Tokopedia", "TikTok Shop", "Lazada"] as const;
const TODAY = "2026-07-19";
const LAST_SYNC_AT = "2026-07-19 11:23 WIB";
const UNMAPPED_SKUS = [
  "SHP-UM-001",
  "TDP-UM-002",
  "TT-UM-003",
  "LZ-UM-004",
  "SHP-UM-005",
  "TDP-UM-006",
  "TT-UM-007",
  "LZ-UM-008",
];

const dashboardOrders = pesananSample.map((order, index) => ({
  ...order,
  status:
    index % 4 === 0
      ? "Menunggu Diproses"
      : index % 4 === 1
      ? "Menunggu Pickup"
      : index % 4 === 2
      ? "Dikirim"
      : "Selesai",
}));

const totalProducts = masterProducts.reduce(
  (sum, product) => sum + product.variations.length,
  0,
);

const totalMasterSkus = masterProducts.length;
const totalWarehouseStock = masterProducts.reduce((sum, product) => sum + product.stock, 0);
const skusLowStock = masterProducts.filter((product) => product.stock < 30).length;
const totalOrdersToday = dashboardOrders.filter((order) => order.date === TODAY).length;
const ordersPendingProcessing = dashboardOrders.filter(
  (order) => order.status === "Menunggu Diproses",
).length;
const ordersPendingPickup = dashboardOrders.filter(
  (order) => order.status === "Menunggu Pickup",
).length;

export const dashboardData: DashboardData = {
  totalProducts,
  totalMasterSkus,
  totalUnmappedSkus: UNMAPPED_SKUS.length,
  totalOrdersToday,
  ordersPendingProcessing,
  ordersPendingPickup,
  totalWarehouseStock,
  skusLowStock,
  activeMarketplaces: MARKETPLACE_LIST.length,
  marketplaceList: MARKETPLACE_LIST,
  lastSyncAt: LAST_SYNC_AT,
};

export const getDashboardData = (): DashboardData => dashboardData;
