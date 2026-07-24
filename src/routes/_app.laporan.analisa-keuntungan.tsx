import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import {
  DollarSign, Percent, Wallet, PackageMinus, TrendingUp, TrendingDown,
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
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  ReportFilterBar, DEFAULT_REPORT_FILTER,
} from "@/components/laporan/report-filter-bar";
import { useProducts } from "@/lib/product-store";
import { usePesanan } from "@/lib/pesanan-store";
import { useMarketplaceConnections } from "@/hooks/use-marketplace-connections";
import {
  reportService,
  type ReportPeriod,
  type ProfitTransactionRow,
} from "@/services/reportService";

export const Route = createFileRoute("/_app/laporan/analisa-keuntungan")({
  head: () => ({
    meta: [
      { title: "Analisa Keuntungan — MAQIL.ERP" },
      { name: "description", content: "Ringkasan laba usaha lintas marketplace." },
    ],
  }),
  component: AnalisaKeuntunganPage,
});

const idr = (n: number) =>
  "Rp " + Math.round(n).toLocaleString("id-ID");

type DetailKind = "potongan" | "biaya" | null;

function AnalisaKeuntunganPage() {
  const products = useProducts();
  const orders = usePesanan();
  const connections = useMarketplaceConnections();
  const [filter, setFilter] = useState(DEFAULT_REPORT_FILTER);
  const [period, setPeriod] = useState<ReportPeriod>("harian");
  const [detail, setDetail] = useState<DetailKind>(null);
  const [tx, setTx] = useState<ProfitTransactionRow | null>(null);

  const ctx = useMemo(
    () => ({ products, orders, connections }),
    [products, orders, connections],
  );

  const kpi = useMemo(() => reportService.getProfitKPI(ctx, filter), [ctx, filter]);
  const trend = useMemo(() => reportService.getTrend(ctx, filter, period), [ctx, filter, period]);
  const rows = useMemo(() => reportService.getProfitPerProduct(ctx, filter, 10), [ctx, filter]);
  const mp = useMemo(() => reportService.getMarketplaceProfit(ctx, filter), [ctx, filter]);
  const txs = useMemo(() => reportService.getProfitTransactions(ctx, filter), [ctx, filter]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analisa Keuntungan"
        description="Fokus pada laba bersih dan performa margin usaha."
      />

      <ReportFilterBar value={filter} onChange={setFilter} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <StatCard label="Total Omzet" value={idr(kpi.totalOmzet)} icon={DollarSign} />
        <button type="button" className="text-left" onClick={() => setDetail("potongan")}>
          <StatCard label="Total Potongan" value={idr(kpi.potonganMarketplace)} icon={Percent} />
        </button>
        <button type="button" className="text-left" onClick={() => setDetail("biaya")}>
          <StatCard label="Total Biaya" value={idr(kpi.biayaAdmin)} icon={Wallet} />
        </button>
        <StatCard label="Total HPP" value={idr(kpi.totalHpp)} icon={PackageMinus} />
        <StatCard label="Laba Kotor" value={idr(kpi.labaKotor)} icon={TrendingUp} />
        <StatCard
          label="Laba Bersih"
          value={idr(kpi.labaBersih)}
          icon={kpi.labaBersih >= 0 ? TrendingUp : TrendingDown}
        />
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold">Trend Profit</h2>
              <p className="text-xs text-muted-foreground">Laba per periode.</p>
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
              <div className="grid h-full place-items-center rounded-lg border border-dashed text-xs text-muted-foreground">
                Belum ada data untuk ditampilkan.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="bucket" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => (Math.abs(v) >= 1000 ? `${Math.round(v / 1000)}k` : `${v}`)} />
                  <Tooltip formatter={(v: number) => idr(v)} />
                  <Bar dataKey="profit" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h2 className="text-base font-semibold">Rincian Transaksi Profit</h2>
          <p className="text-xs text-muted-foreground">Klik salah satu baris untuk melihat rincian.</p>
          <div className="mt-4 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No Pesanan</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Marketplace</TableHead>
                  <TableHead>Produk</TableHead>
                  <TableHead className="text-right">Omzet</TableHead>
                  <TableHead className="text-right">Potongan</TableHead>
                  <TableHead className="text-right">Biaya</TableHead>
                  <TableHead className="text-right">HPP</TableHead>
                  <TableHead className="text-right">Pendapatan Bersih</TableHead>
                  <TableHead className="text-right">Laba Bersih</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {txs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="py-10 text-center text-sm text-muted-foreground">
                      Belum ada transaksi.
                    </TableCell>
                  </TableRow>
                ) : txs.map((t) => (
                  <TableRow
                    key={t.orderId}
                    className="cursor-pointer"
                    onClick={() => setTx(t)}
                  >
                    <TableCell className="font-mono text-xs">{t.orderId}</TableCell>
                    <TableCell>{t.createdAt}</TableCell>
                    <TableCell>{t.marketplace}</TableCell>
                    <TableCell className="max-w-[220px] truncate">{t.productName}</TableCell>
                    <TableCell className="text-right">{idr(t.sellingPrice)}</TableCell>
                    <TableCell className="text-right">{idr(t.potongan)}</TableCell>
                    <TableCell className="text-right">{idr(t.biaya)}</TableCell>
                    <TableCell className="text-right">{idr(t.hpp)}</TableCell>
                    <TableCell className="text-right">{idr(t.netRevenue)}</TableCell>
                    <TableCell className="text-right font-medium">
                      <span className={t.netProfit >= 0 ? "text-emerald-600" : "text-red-600"}>{idr(t.netProfit)}</span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardContent className="p-6">
            <h2 className="text-base font-semibold">Profit per Produk</h2>
            <p className="text-xs text-muted-foreground">Diurutkan dari profit terbesar.</p>
            <div className="mt-4 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead>Nama Produk</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Harga Jual</TableHead>
                    <TableHead className="text-right">HPP</TableHead>
                    <TableHead className="text-right">Omzet</TableHead>
                    <TableHead className="text-right">Profit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                        Belum ada data profit.
                      </TableCell>
                    </TableRow>
                  ) : rows.map((r) => (
                    <TableRow key={r.sku}>
                      <TableCell className="font-mono text-xs">{r.sku}</TableCell>
                      <TableCell>{r.name}</TableCell>
                      <TableCell className="text-right">{r.qty}</TableCell>
                      <TableCell className="text-right">{idr(r.hargaJual)}</TableCell>
                      <TableCell className="text-right">{r.hpp > 0 ? idr(r.hpp) : <span className="text-muted-foreground">—</span>}</TableCell>
                      <TableCell className="text-right">{idr(r.omzet)}</TableCell>
                      <TableCell className="text-right font-medium">
                        <span className={r.profit >= 0 ? "text-emerald-600" : "text-red-600"}>{idr(r.profit)}</span>
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
            <h2 className="text-base font-semibold">Profit per Marketplace</h2>
            <p className="text-xs text-muted-foreground">Ringkasan laba per channel.</p>
            <div className="mt-4 space-y-3">
              {mp.length === 0 ? (
                <div className="rounded-md border border-dashed py-8 text-center text-xs text-muted-foreground">
                  Belum ada marketplace terhubung.
                </div>
              ) : mp.map((m) => (
                <div key={m.marketplace} className="rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{m.marketplace}</span>
                    <Badge variant={m.profit >= 0 ? "secondary" : "destructive"}>
                      {m.profit >= 0 ? "Untung" : "Rugi"}
                    </Badge>
                  </div>
                  <div className="mt-3 space-y-2 text-sm">
                    <Row label="Omzet" value={idr(m.omzet)} />
                    <Row label="Fee Marketplace" value={idr(m.fee)} />
                    <Row label="Profit" value={idr(m.profit)} strong />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialog: Breakdown Total Potongan */}
      <Dialog open={detail === "potongan"} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rincian Total Potongan</DialogTitle>
            <DialogDescription>Breakdown potongan yang mengurangi omzet.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 text-sm">
            <Row label="Voucher Toko" value={idr(kpi.potongan.voucherStore)} />
            <Row label="Voucher Marketplace" value={idr(kpi.potongan.voucherMarketplace)} />
            <Row label="Diskon Campaign" value={idr(kpi.potongan.campaignDiscount)} />
            <div className="border-t pt-2">
              <Row label="Total Potongan" value={idr(kpi.potongan.total)} strong />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog: Breakdown Total Biaya */}
      <Dialog open={detail === "biaya"} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rincian Total Biaya</DialogTitle>
            <DialogDescription>Breakdown biaya yang dipotong marketplace.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 text-sm">
            <Row label="Biaya Admin Marketplace" value={idr(kpi.biaya.adminFee)} />
            <Row label="Biaya Layanan" value={idr(kpi.biaya.serviceFee)} />
            <Row label="Gratis Ongkir" value={idr(kpi.biaya.shippingSubsidy)} />
            <Row label="COD" value={idr(kpi.biaya.codFee)} />
            <Row label="Affiliate" value={idr(kpi.biaya.affiliateFee)} />
            <Row label="Iklan" value={idr(kpi.biaya.adsFee)} />
            <div className="border-t pt-2">
              <Row label="Total Biaya" value={idr(kpi.biaya.total)} strong />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog: Detail Transaksi */}
      <Dialog open={!!tx} onOpenChange={(o) => !o && setTx(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detail Transaksi</DialogTitle>
            <DialogDescription>
              {tx ? `${tx.orderId} • ${tx.marketplace} • ${tx.createdAt}` : ""}
            </DialogDescription>
          </DialogHeader>
          {tx && (
            <div className="space-y-2 text-sm">
              <Row label="Produk" value={tx.productName} />
              <Row label="Harga Jual" value={idr(tx.sellingPrice)} />
              <Row label="Voucher Toko" value={idr(tx.voucherStore)} />
              <Row label="Voucher Marketplace" value={idr(tx.voucherMarketplace)} />
              <Row label="Diskon Campaign" value={idr(tx.campaignDiscount)} />
              <Row label="Biaya Admin Marketplace" value={idr(tx.adminFee)} />
              <Row label="Biaya Layanan" value={idr(tx.serviceFee)} />
              <Row label="Gratis Ongkir" value={idr(tx.shippingSubsidy)} />
              <Row label="COD" value={idr(tx.codFee)} />
              <Row label="Affiliate" value={idr(tx.affiliateFee)} />
              <Row label="Iklan" value={idr(tx.adsFee)} />
              <div className="border-t pt-2">
                <Row label="Pendapatan Bersih" value={idr(tx.netRevenue)} />
                <Row label="HPP" value={idr(tx.hpp)} />
                <Row label="Laba Bersih" value={idr(tx.netProfit)} strong />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={strong ? "font-semibold" : "font-medium"}>{value}</span>
    </div>
  );
}
