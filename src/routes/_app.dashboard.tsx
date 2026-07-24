import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Package,
  ShoppingCart,
  Boxes,
  Store,
  Truck,
  Layers,
  Activity,
  AlertTriangle,
  Printer,
  CheckCircle2,
  PackageX,
  Clock,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { PageHeader } from "@/components/common/page-header";
import { StatCard } from "@/components/common/stat-card";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useProducts, isLowStock, hasOutOfStock } from "@/lib/product-store";
import { useAuth } from "@/lib/auth-store";
import { usePesanan } from "@/lib/pesanan-store";
import { useMarketplaceConnections } from "@/hooks/use-marketplace-connections";
import {
  STOCK_TRANSACTION_LABEL,
  useStockHistory,
  type StockHistoryEntry,
} from "@/lib/stock-history-store";
import type { PesananStatus } from "@/data/pesanan";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, "") ??
  "http://localhost:3000";

interface BackendListResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface BackendProduct {
  id: string;
  productCode: string;
  name: string;
  status: string;
}

interface BackendStock {
  id: string;
  qty: number;
  minimumStock: number;
  product: {
    id: string;
    productCode: string;
    name: string;
    status: string;
  };
}

interface BackendStockMovement {
  id: string;
  productId: string | null;
  type: string;
  beforeQty: number;
  qty: number;
  afterQty: number;
  adjustmentQty: number | null;
  reference: string | null;
  notes: string | null;
  createdBy: { id: string; name: string; email: string } | null;
  createdAt: string;
  stock?: {
    product?: {
      productCode?: string;
      name?: string;
    };
  } | null;
}

function getDashboardAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem("maqil.auth.session");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { accessToken?: string };
    return parsed.accessToken ?? null;
  } catch {
    return null;
  }
}

async function fetchBackend<T>(path: string): Promise<T> {
  const token = getDashboardAuthToken();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    throw new Error(`Backend request failed: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — MAQIL.ERP" },
      { name: "description", content: "Ringkasan operasional MAQIL.ERP." },
    ],
  }),
  component: DashboardPage,
});

const ORDER_STATUSES: PesananStatus[] = [
  "Menunggu Diproses",
  "Menunggu Dicetak",
  "Menunggu Pickup",
  "Dikirim",
  "Selesai",
];

function formatDate(ts: number) {
  const d = new Date(ts);
  return d.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function DashboardPage() {
  const { currentUser } = useAuth();
  const products = useProducts();
  const orders = usePesanan();
  const connections = useMarketplaceConnections();
  const history = useStockHistory();

  const [backendProductCount, setBackendProductCount] = useState<number | null>(null);
  const [backendTotalSku, setBackendTotalSku] = useState<number | null>(null);
  const [backendTotalStock, setBackendTotalStock] = useState<number | null>(null);
  const [backendLowStockCount, setBackendLowStockCount] = useState<number | null>(null);
  const [backendOutOfStockCount, setBackendOutOfStockCount] = useState<number | null>(null);
  const [backendHistory, setBackendHistory] = useState<StockHistoryEntry[] | null>(null);

  const liveProducts = useMemo(
    () => products.filter((p) => p.status === "live"),
    [products],
  );

  const localTotalSku = useMemo(
    () =>
      liveProducts.reduce(
        (sum, p) => sum + (p.variants?.length || 1),
        0,
      ),
    [liveProducts],
  );

  const localTotalStock = useMemo(
    () =>
      liveProducts.reduce((sum, p) => {
        if (p.variants && p.variants.length > 0) {
          return sum + p.variants.reduce((s, v) => s + (v.stok ?? 0), 0);
        }
        return sum + (p.stok ?? 0);
      }, 0),
    [liveProducts],
  );

  const localLowStockCount = useMemo(
    () => liveProducts.filter(isLowStock).length,
    [liveProducts],
  );

  const localOutOfStockCount = useMemo(
    () => liveProducts.filter(hasOutOfStock).length,
    [liveProducts],
  );

  const totalProducts = backendProductCount ?? liveProducts.length;
  const totalSku = backendTotalSku ?? localTotalSku;
  const marketplaceConnected = useMemo(
    () => connections.filter((c) => c.connected).length,
    [connections],
  );
  const totalStock = backendTotalStock ?? localTotalStock;
  const lowStockCount = backendLowStockCount ?? localLowStockCount;
  const outOfStockCount = backendOutOfStockCount ?? localOutOfStockCount;
  const displayHistory = backendHistory ?? history;

  useEffect(() => {
    if (!currentUser?.accessToken) return;

    let active = true;

    async function loadTelemetry() {
      try {
        const productResponse = await fetchBackend<BackendListResponse<BackendProduct>>("/products?limit=1000");
        const stockResponse = await fetchBackend<BackendListResponse<BackendStock>>("/stocks?limit=1000");
        const historyResponse = await fetchBackend<{ success: boolean; data: BackendStockMovement[] }>(
          "/stock-movements?limit=100",
        );

        if (!active) return;

        setBackendProductCount(productResponse.total);
        setBackendTotalSku(stockResponse.data.length);
        setBackendTotalStock(stockResponse.data.reduce((sum, stock) => sum + stock.qty, 0));
        setBackendLowStockCount(
          stockResponse.data.filter((stock) => stock.qty > 0 && stock.qty <= stock.minimumStock).length,
        );
        setBackendOutOfStockCount(stockResponse.data.filter((stock) => stock.qty <= 0).length);
        setBackendHistory(
          historyResponse.data.map((item) => ({
            id: item.id,
            createdAt: new Date(item.createdAt).getTime(),
            transactionType:
              item.type === "IN"
                ? "ADD_STOCK"
                : item.type === "OUT"
                ? "REMOVE_STOCK"
                : item.type === "OPNAME"
                ? "STOCK_OPNAME"
                : item.type === "MARKETPLACE"
                ? "MARKETPLACE_SYNC"
                : "TRANSFER",
            referenceNo: item.reference ?? "-",
            productId: item.productId ?? "",
            variantIndex: null,
            sku: item.stock?.product?.productCode ?? "-",
            productName: item.stock?.product?.name ?? "Unknown Produk",
            variation: "",
            warehouse: "Gudang",
            beforeStock: item.beforeQty,
            changeQty: item.type === "OUT" ? -item.qty : item.qty,
            afterStock: item.afterQty,
            note: item.notes ?? undefined,
            user: item.createdBy?.name ?? item.createdBy?.email ?? undefined,
          })),
        );
      } catch {
        // degrade gracefully to local data.
      }
    }

    void loadTelemetry();

    return () => {
      active = false;
    };
  }, [currentUser?.accessToken, history]);

  const orderCounts = useMemo(() => {
    const map = new Map<PesananStatus, number>();
    for (const s of ORDER_STATUSES) map.set(s, 0);
    for (const o of orders) {
      if (map.has(o.status)) map.set(o.status, (map.get(o.status) ?? 0) + 1);
    }
    return map;
  }, [orders]);

  const recentHistory = useMemo(
    () =>
      [...displayHistory]
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 10),
    [displayHistory],
  );

  const stockChartData = useMemo(() => {
    const byDay = new Map<string, number>();
    for (const h of displayHistory) {
      const d = new Date(h.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      byDay.set(key, (byDay.get(key) ?? 0) + 1);
    }
    return [...byDay.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-14)
      .map(([date, count]) => {
        const d = new Date(date);
        return {
          date: d.toLocaleDateString("id-ID", { day: "2-digit", month: "short" }),
          transaksi: count,
        };
      });
  }, [displayHistory]);

  const orderChartData = useMemo(
    () =>
      ORDER_STATUSES.map((s) => ({
        status: s,
        jumlah: orderCounts.get(s) ?? 0,
      })),
    [orderCounts],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Selamat Datang di MAQIL ERP"
        description="Ringkasan singkat operasional Anda hari ini."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Link to="/produk">
          <StatCard
            label="Total Produk"
            value={totalProducts.toString()}
            hint="Produk berstatus Live"
            icon={Package}
          />
        </Link>
        <Link to="/gudang/rincian-stok">
          <StatCard
            label="Total SKU"
            value={totalSku.toString()}
            hint="Seluruh SKU variasi"
            icon={Layers}
          />
        </Link>
        <Link to="/marketplace">
          <StatCard
            label="Marketplace Terhubung"
            value={`${marketplaceConnected} Marketplace`}
            hint={connections
              .filter((c) => c.connected)
              .map((c) => c.marketplace)
              .join(", ") || "Belum ada koneksi"}
            icon={Store}
          />
        </Link>
        <Link to="/gudang/rincian-stok">
          <StatCard
            label="Total Stok Gudang"
            value={totalStock.toLocaleString("id-ID")}
            hint="Total stok seluruh SKU"
            icon={Boxes}
          />
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Link to="/produk" search={{ filter: "low-stock" } as never}>
          <StatCard
            label="Produk Stok Menipis"
            value={lowStockCount.toString()}
            hint="Ada variasi ≤ batas minimum"
            icon={Activity}
          />
        </Link>
        <Link to="/produk">
          <StatCard
            label="Produk Habis"
            value={outOfStockCount.toString()}
            hint="Ada variasi dengan stok 0"
            icon={PackageX}
          />
        </Link>
        <Link to="/pesanan/menunggu-diproses">
          <StatCard
            label="Menunggu Diproses"
            value={(orderCounts.get("Menunggu Diproses") ?? 0).toString()}
            icon={ShoppingCart}
          />
        </Link>
        <Link to="/pesanan/menunggu-dicetak">
          <StatCard
            label="Menunggu Dicetak"
            value={(orderCounts.get("Menunggu Dicetak") ?? 0).toString()}
            icon={Printer}
          />
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Link to="/pesanan/menunggu-pickup">
          <StatCard
            label="Menunggu Pickup"
            value={(orderCounts.get("Menunggu Pickup") ?? 0).toString()}
            icon={Truck}
          />
        </Link>
        <Link to="/pesanan/dikirim">
          <StatCard
            label="Dikirim"
            value={(orderCounts.get("Dikirim") ?? 0).toString()}
            icon={Truck}
          />
        </Link>
        <Link to="/pesanan/selesai">
          <StatCard
            label="Selesai"
            value={(orderCounts.get("Selesai") ?? 0).toString()}
            icon={CheckCircle2}
          />
        </Link>
        <StatCard
          label="Total Transaksi Stok"
          value={history.length.toLocaleString("id-ID")}
          hint="Seluruh entri Riwayat Stok"
          icon={AlertTriangle}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <h2 className="text-base font-semibold">Pergerakan Stok</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Jumlah transaksi stok per hari (14 hari terakhir dari Riwayat Stok).
            </p>
            <div className="mt-4 h-64">
              {stockChartData.length === 0 ? (
                <div className="grid h-full place-items-center rounded-lg border border-dashed text-xs text-muted-foreground">
                  Belum ada transaksi stok
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stockChartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis allowDecimals={false} className="text-xs" />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="transaksi"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h2 className="text-base font-semibold">Pesanan per Status</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Jumlah pesanan berdasarkan status saat ini.
            </p>
            <div className="mt-4 h-64">
              {orders.length === 0 ? (
                <div className="grid h-full place-items-center rounded-lg border border-dashed text-xs text-muted-foreground">
                  Belum ada pesanan
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={orderChartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis
                      dataKey="status"
                      className="text-xs"
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis allowDecimals={false} className="text-xs" />
                    <Tooltip />
                    <Bar dataKey="jumlah" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">Aktivitas Terbaru</h2>
              <Link
                to="/gudang/riwayat-stok"
                className="text-xs text-primary hover:underline"
              >
                Lihat semua →
              </Link>
            </div>
            {recentHistory.length === 0 ? (
              <div className="mt-6 grid h-40 place-items-center rounded-lg border border-dashed text-xs text-muted-foreground">
                Belum ada aktivitas stok.
              </div>
            ) : (
              <ul className="mt-4 divide-y">
                {recentHistory.map((h) => (
                  <li key={h.id} className="flex items-start gap-3 py-3 text-sm">
                    <div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
                      <Clock className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="secondary" className="text-[10px]">
                          {STOCK_TRANSACTION_LABEL[h.transactionType as keyof typeof STOCK_TRANSACTION_LABEL]}
                        </Badge>
                        <span className="font-mono text-xs text-muted-foreground">
                          {h.sku}
                        </span>
                        <span
                          className={`text-xs font-medium ${
                            h.changeQty > 0
                              ? "text-emerald-600"
                              : h.changeQty < 0
                                ? "text-red-600"
                                : "text-muted-foreground"
                          }`}
                        >
                          {h.changeQty > 0 ? "+" : ""}
                          {h.changeQty}
                        </span>
                      </div>
                      <p className="mt-1 truncate text-sm">{h.productName}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(h.createdAt)}
                        {h.user ? ` • ${h.user}` : ""}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h2 className="text-base font-semibold">Status Marketplace</h2>
            <ul className="mt-4 space-y-3 text-sm">
              {connections.length === 0 ? (
                <li className="text-xs text-muted-foreground">
                  Belum ada marketplace terhubung.
                </li>
              ) : (
                connections.map((c) => (
                  <li
                    key={c.marketplace}
                    className="flex items-center justify-between"
                  >
                    <span>{c.marketplace}</span>
                    <Badge
                      className={
                        c.connected
                          ? "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/10"
                          : "bg-muted text-muted-foreground hover:bg-muted"
                      }
                    >
                      {c.connected ? "Connected" : "Disconnected"}
                    </Badge>
                  </li>
                ))
              )}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
