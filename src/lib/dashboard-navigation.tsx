import { useNavigate } from "@tanstack/react-router";
import type { ReactNode, KeyboardEvent } from "react";

export type DashboardNavigationAction =
  | "totalProducts"
  | "totalMasterSkus"
  | "totalUnmappedSkus"
  | "ordersToday"
  | "ordersPendingProcessing"
  | "ordersPendingPickup"
  | "totalWarehouseStock"
  | "skusLowStock"
  | "activeMarketplaces"
  | "lastSyncAt";

export const dashboardNavigationMap: Record<DashboardNavigationAction, { to: string; ariaLabel: string }> = {
  totalProducts: {
    to: "/produk",
    ariaLabel: "Buka halaman Produk",
  },
  totalMasterSkus: {
    to: "/gudang/rincian-stok",
    ariaLabel: "Buka halaman Stok Produk",
  },
  totalUnmappedSkus: {
    to: "/produk",
    ariaLabel: "Buka halaman Produk Belum Mapping",
  },
  ordersToday: {
    to: "/pesanan",
    ariaLabel: "Buka halaman Pesanan Hari Ini",
  },
  ordersPendingProcessing: {
    to: "/pesanan/menunggu-diproses",
    ariaLabel: "Buka halaman Pesanan Menunggu Diproses",
  },
  ordersPendingPickup: {
    to: "/pesanan/menunggu-pickup",
    ariaLabel: "Buka halaman Pesanan Menunggu Pickup",
  },
  totalWarehouseStock: {
    to: "/gudang/rincian-stok",
    ariaLabel: "Buka halaman Rincian Stok Gudang",
  },
  skusLowStock: {
    to: "/gudang/rincian-stok",
    ariaLabel: "Buka halaman Gudang Stok Minimum",
  },
  activeMarketplaces: {
    to: "/marketplace",
    ariaLabel: "Buka halaman Marketplace",
  },
  lastSyncAt: {
    to: "/sinkronisasi",
    ariaLabel: "Buka halaman Sinkronisasi",
  },
};

export const getDashboardNavigation = (action: DashboardNavigationAction) =>
  dashboardNavigationMap[action];

export function DashboardCardAction({
  action,
  children,
}: {
  action: DashboardNavigationAction;
  children: ReactNode;
}) {
  const navigate = useNavigate();
  const { to, ariaLabel } = getDashboardNavigation(action);

  const handleClick = () => {
    navigate({ to });
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      navigate({ to });
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={ariaLabel}
      className="group cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary/50 focus-visible:ring-2 focus-visible:ring-primary/20"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      {children}
      <p className="mt-2 text-xs text-muted-foreground">Lihat Detail →</p>
    </div>
  );
}
