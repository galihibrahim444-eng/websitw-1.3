import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Search, History } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useStockHistory,
  STOCK_TRANSACTION_LABEL,
  StockTransactionType,
  type StockHistoryEntry,
} from "@/lib/stock-history-store";

export const Route = createFileRoute("/_app/gudang/riwayat-stok")({
  head: () => ({
    meta: [
      { title: "Riwayat Stok — MAQIL.ERP" },
      {
        name: "description",
        content:
          "Audit trail pergerakan stok: penambahan, pengurangan, stock opname, pesanan, retur, mutasi, dan sinkronisasi marketplace.",
      },
    ],
  }),
  component: RiwayatStokPage,
});

const PAGE_SIZE = 20;

const TYPE_BADGE: Record<StockTransactionType, string> = {
  ADD_STOCK: "bg-emerald-100 text-emerald-700 border-emerald-200",
  REMOVE_STOCK: "bg-red-100 text-red-700 border-red-200",
  STOCK_OPNAME: "bg-blue-100 text-blue-700 border-blue-200",
  ORDER: "bg-purple-100 text-purple-700 border-purple-200",
  ORDER_CANCEL: "bg-slate-100 text-slate-700 border-slate-200",
  RETURN_IN: "bg-teal-100 text-teal-700 border-teal-200",
  RETURN_OUT: "bg-amber-100 text-amber-700 border-amber-200",
  TRANSFER: "bg-indigo-100 text-indigo-700 border-indigo-200",
  MARKETPLACE_SYNC: "bg-sky-100 text-sky-700 border-sky-200",
};

function fmtDateTime(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toDateInput(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function startOfDay(dateStr: string): number {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1, 0, 0, 0, 0).getTime();
}
function endOfDay(dateStr: string): number {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1, 23, 59, 59, 999).getTime();
}

function RiwayatStokPage() {
  const history = useStockHistory();

  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [type, setType] = useState<string>("all");
  const [warehouse, setWarehouse] = useState<string>("all");
  const [user, setUser] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const warehouseOptions = useMemo(
    () => Array.from(new Set(history.map((h) => h.warehouse).filter(Boolean))),
    [history],
  );
  const userOptions = useMemo(
    () =>
      Array.from(
        new Set(history.map((h) => h.user).filter((u): u is string => !!u)),
      ),
    [history],
  );

  const filtered = useMemo<StockHistoryEntry[]>(() => {
    const q = search.trim().toLowerCase();
    const fromTs = dateFrom ? startOfDay(dateFrom) : null;
    const toTs = dateTo ? endOfDay(dateTo) : null;
    return history.filter((h) => {
      if (fromTs !== null && h.createdAt < fromTs) return false;
      if (toTs !== null && h.createdAt > toTs) return false;
      if (type !== "all" && h.transactionType !== type) return false;
      if (warehouse !== "all" && h.warehouse !== warehouse) return false;
      if (user !== "all" && (h.user ?? "") !== user) return false;
      if (q) {
        const hay =
          `${h.sku} ${h.productName} ${h.variation} ${h.referenceNo} ${h.note ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [history, search, dateFrom, dateTo, type, warehouse, user]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = useMemo(
    () =>
      filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [filtered, currentPage],
  );

  const resetFilter = () => {
    setDateFrom("");
    setDateTo("");
    setType("all");
    setWarehouse("all");
    setUser("all");
    setSearch("");
    setPage(1);
  };

  const onFilterChange = () => setPage(1);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Riwayat Stok"
        description="Audit trail seluruh pergerakan stok. Read-only — dicatat otomatis dari modul yang mengubah stok."
      />

      <Card className="p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <div className="space-y-1">
            <Label className="text-xs">Dari Tanggal</Label>
            <Input
              type="date"
              value={dateFrom}
              max={dateTo || undefined}
              onChange={(e) => {
                setDateFrom(e.target.value);
                onFilterChange();
              }}
              className="h-9"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Sampai Tanggal</Label>
            <Input
              type="date"
              value={dateTo}
              min={dateFrom || undefined}
              onChange={(e) => {
                setDateTo(e.target.value);
                onFilterChange();
              }}
              className="h-9"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Jenis Transaksi</Label>
            <Select
              value={type}
              onValueChange={(v) => {
                setType(v);
                onFilterChange();
              }}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Jenis</SelectItem>
                {Object.values(StockTransactionType).map((t) => (
                  <SelectItem key={t} value={t}>
                    {STOCK_TRANSACTION_LABEL[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Gudang</Label>
            <Select
              value={warehouse}
              onValueChange={(v) => {
                setWarehouse(v);
                onFilterChange();
              }}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Gudang</SelectItem>
                {warehouseOptions.map((w) => (
                  <SelectItem key={w} value={w}>
                    {w}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">User</Label>
            <Select
              value={user}
              onValueChange={(v) => {
                setUser(v);
                onFilterChange();
              }}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua User</SelectItem>
                {userOptions.length === 0 ? (
                  <SelectItem value="__none" disabled>
                    (Belum ada)
                  </SelectItem>
                ) : (
                  userOptions.map((u) => (
                    <SelectItem key={u} value={u}>
                      {u}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Cari Produk / SKU / Ref</Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  onFilterChange();
                }}
                placeholder="SKU, nama, ref..."
                className="h-9 pl-9"
              />
            </div>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
          <div>
            Menampilkan{" "}
            <span className="font-medium text-foreground">
              {filtered.length}
            </span>{" "}
            entri riwayat.
          </div>
          <Button variant="ghost" size="sm" onClick={resetFilter}>
            Reset Filter
          </Button>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="whitespace-nowrap">Tanggal</TableHead>
                <TableHead className="whitespace-nowrap">Jenis</TableHead>
                <TableHead className="whitespace-nowrap">No. Referensi</TableHead>
                <TableHead className="whitespace-nowrap">SKU ERP</TableHead>
                <TableHead>Nama Produk</TableHead>
                <TableHead className="whitespace-nowrap">Gudang</TableHead>
                <TableHead className="text-right whitespace-nowrap">
                  Stok Sebelum
                </TableHead>
                <TableHead className="text-right whitespace-nowrap">
                  Perubahan
                </TableHead>
                <TableHead className="text-right whitespace-nowrap">
                  Stok Sesudah
                </TableHead>
                <TableHead className="whitespace-nowrap">User</TableHead>
                <TableHead>Catatan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
                      <History className="h-8 w-8 opacity-40" />
                      <div>Belum ada riwayat pergerakan stok.</div>
                      <div className="text-xs">
                        Riwayat akan otomatis muncul dari Penambahan Stok,
                        Pengurangan Stok, dan Stock Opname.
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                pageItems.map((h) => (
                  <TableRow key={h.id}>
                    <TableCell className="whitespace-nowrap text-xs tabular-nums text-muted-foreground">
                      {fmtDateTime(h.createdAt)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`${TYPE_BADGE[h.transactionType]} whitespace-nowrap`}
                      >
                        {STOCK_TRANSACTION_LABEL[h.transactionType]}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {h.referenceNo}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{h.sku}</TableCell>
                    <TableCell className="min-w-[220px]">
                      <div className="text-sm font-medium">{h.productName}</div>
                      {h.variation && h.variation !== "-" && (
                        <div className="text-xs text-muted-foreground">
                          Variasi: {h.variation}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-xs">
                      {h.warehouse}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {h.beforeStock}
                    </TableCell>
                    <TableCell
                      className={`text-right tabular-nums font-semibold ${
                        h.changeQty > 0
                          ? "text-emerald-600"
                          : h.changeQty < 0
                            ? "text-red-600"
                            : "text-muted-foreground"
                      }`}
                    >
                      {h.changeQty > 0 ? `+${h.changeQty}` : h.changeQty}
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-medium">
                      {h.afterStock}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                      {h.user ?? "-"}
                    </TableCell>
                    <TableCell className="max-w-[280px] text-xs text-muted-foreground">
                      {h.note ?? "-"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {filtered.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-t bg-muted/20 px-4 py-3 text-xs text-muted-foreground">
            <div>
              Halaman{" "}
              <span className="font-medium text-foreground">{currentPage}</span>{" "}
              dari{" "}
              <span className="font-medium text-foreground">{totalPages}</span>{" "}
              · {PAGE_SIZE} per halaman
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Sebelumnya
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Berikutnya
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* toDateInput dipertahankan untuk pemakaian mendatang (preset periode) */}
      <span className="sr-only">{toDateInput(Date.now())}</span>
    </div>
  );
}
