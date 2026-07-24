import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from "recharts";
import {
  ShoppingCart, Package, DollarSign, Layers, Boxes, TrendingUp,
} from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { StatCard } from "@/components/common/stat-card";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ReportFilterBar, DEFAULT_REPORT_FILTER,
} from "@/components/laporan/report-filter-bar";
import { useProducts } from "@/lib/product-store";
import { usePesanan } from "@/lib/pesanan-store";
import { useMarketplaceConnections } from "@/hooks/use-marketplace-connections";
import { reportService, type ReportPeriod } from "@/services/reportService";

export const Route = createFileRoute("/_app/laporan/analisa-bisnis")({
  head: () => ({
    meta: [
      { title: "Analisa Bisnis — MAQIL.ERP" },
      { name: "description", content: "Ringkasan performa operasional bisnis." },
    ],
  }),
  component: AnalisaBisnisPage,
});

const idr = (n: number) =>
  "Rp " + Math.round(n).toLocaleString("id-ID");

function AnalisaBisnisPage() {
  const products = useProducts();
  const orders = usePesanan();
  const connections = useMarketplaceConnections();
  const [filter, setFilter] = useState(DEFAULT_REPORT_FILTER);
  const [period, setPeriod] = useState<ReportPeriod>("harian");

  const ctx = useMemo(
    () => ({ products, orders, connections }),
    [products, orders, connections],
  );

  const kpi = useMemo(() => reportService.getBusinessKPI(ctx, filter), [ctx, filter]);
  const trend = useMemo(() => reportService.getTrend(ctx, filter, period), [ctx, filter, period]);
  const top = useMemo(() => reportService.getTopProducts(ctx, filter, 10), [ctx, filter]);
  const mp = useMemo(() => reportService.getMarketplaceSummary(ctx, filter), [ctx, filter]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analisa Bisnis"
        description="Pusat analisis operasional bisnis lintas marketplace."
      />

      <ReportFilterBar value={filter} onChange={setFilter} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <StatCard label="Jumlah Pesanan" value={kpi.jumlahPesanan.toLocaleString("id-ID")} icon={ShoppingCart} />
        <StatCard label="Produk Terjual" value={kpi.produkTerjual.toLocaleString("id-ID")} icon={Boxes} />
        <StatCard label="Omzet Penjualan" value={idr(kpi.omzet)} icon={DollarSign} />
        <StatCard label="Produk Aktif" value={kpi.produkAktif.toLocaleString("id-ID")} icon={Package} />
        <StatCard label="SKU Aktif" value={kpi.skuAktif.toLocaleString("id-ID")} icon={Layers} />
        <StatCard label="Rata-rata Order" value={idr(kpi.rataNilaiOrder)} icon={TrendingUp} />
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold">Trend Penjualan</h2>
              <p className="text-xs text-muted-foreground">Omzet & jumlah pesanan per periode.</p>
            </div>
            <Tabs value={period} onValueChange={(v) => setPeriod(v as ReportPeriod)}>
              <TabsList>
                <TabsTrigger value="harian">Harian</TabsTrigger>
                <TabsTrigger value="mingguan">Mingguan</TabsTrigger>
                <TabsTrigger value="bulanan">Bulanan</TabsTrigger>
                <TabsTrigger value="tahunan">Tahunan</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div className="mt-6 h-72">
            {trend.length === 0 ? (
              <EmptyChart />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="bucket" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : `${v}`)} />
                  <Tooltip formatter={(v: number, name) => (name === "omzet" ? idr(v) : v.toString())} />
                  <Line type="monotone" dataKey="omzet" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="pesanan" stroke="hsl(var(--muted-foreground))" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardContent className="p-6">
            <h2 className="text-base font-semibold">Produk Terlaris</h2>
            <p className="text-xs text-muted-foreground">Diurutkan dari jumlah terjual terbanyak.</p>
            <div className="mt-4 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead>Nama Produk</TableHead>
                    <TableHead className="text-right">Qty Terjual</TableHead>
                    <TableHead className="text-right">Omzet</TableHead>
                    <TableHead className="text-right">Sisa Stock</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {top.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                        Belum ada data penjualan.
                      </TableCell>
                    </TableRow>
                  ) : top.map((r) => (
                    <TableRow key={r.sku}>
                      <TableCell className="font-mono text-xs">{r.sku}</TableCell>
                      <TableCell>{r.name}</TableCell>
                      <TableCell className="text-right">{r.qty}</TableCell>
                      <TableCell className="text-right">{idr(r.omzet)}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={r.sisaStock <= 0 ? "destructive" : "secondary"}>{r.sisaStock}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h2 className="text-base font-semibold">Ringkasan Marketplace</h2>
            <p className="text-xs text-muted-foreground">Performa penjualan per marketplace.</p>
            <div className="mt-4 space-y-3">
              {mp.length === 0 ? (
                <div className="rounded-md border border-dashed py-8 text-center text-xs text-muted-foreground">
                  Belum ada marketplace terhubung.
                </div>
              ) : mp.map((m) => (
                <div key={m.marketplace} className="rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{m.marketplace}</span>
                    <Badge variant="outline">{m.jumlahPesanan} pesanan</Badge>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="text-xs text-muted-foreground">Omzet</div>
                      <div className="font-medium">{idr(m.omzet)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Produk Terjual</div>
                      <div className="font-medium">{m.produkTerjual}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="grid h-full place-items-center rounded-lg border border-dashed text-xs text-muted-foreground">
      Belum ada data untuk ditampilkan.
    </div>
  );
}
