// COPILOT EDIT TEST
import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { format, subDays } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { CalendarIcon, Search } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { LabelPreviewDialog } from "@/components/common/label-preview-dialog";
import { printShippingLabels } from "@/lib/print-label";
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
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { cn } from "@/lib/utils";
import type { DateRange } from "react-day-picker";
import { type Marketplace, type PesananRow } from "@/data/pesanan";
import { pesananStore, usePesanan } from "@/lib/pesanan-store";
import { ProductCell } from "@/components/common/product-cell";

const marketplaceStyle: Record<Marketplace, string> = {
  Shopee: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  Tokopedia: "bg-green-500/10 text-green-600 dark:text-green-400",
  "TikTok Shop": "bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400",
  Lazada: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
};

const idr = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);

type QuickRange = "today" | "yesterday" | "7d" | "30d" | "90d" | "all";

const quickRanges: { key: QuickRange; label: string }[] = [
  { key: "today", label: "Hari Ini" },
  { key: "yesterday", label: "Kemarin" },
  { key: "7d", label: "7 Hari" },
  { key: "30d", label: "30 Hari" },
  { key: "90d", label: "90 Hari" },
  { key: "all", label: "Semua" },
];

export type PesananAction = {
  label: string;
  variant?: "default" | "outline" | "secondary";
};

const PAGE_SIZE = 8;

export function PesananList({
  title,
  description,
  statusLabel,
  statusClass,
  actions = [],
}: {
  title: string;
  description: string;
  statusLabel: string;
  statusClass: string;
  actions?: PesananAction[];
}) {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [searchField, setSearchField] = useState("no_pesanan");
  const [marketplace, setMarketplace] = useState("all");
  const [toko, setToko] = useState("all");
  const [pengiriman, setPengiriman] = useState("all");
  const [range, setRange] = useState<DateRange | undefined>();
  const [quick, setQuick] = useState<QuickRange>("all");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const items = usePesanan();
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);

  const applyQuick = (q: QuickRange) => {
    setQuick(q);
    const today = new Date();
    if (q === "all") return setRange(undefined);
    if (q === "today") return setRange({ from: today, to: today });
    if (q === "yesterday") {
      const y = subDays(today, 1);
      return setRange({ from: y, to: y });
    }
    const days = q === "7d" ? 7 : q === "30d" ? 30 : 90;
    setRange({ from: subDays(today, days - 1), to: today });
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((r) => {
      if (r.status !== statusLabel) return false;
      if (marketplace !== "all" && r.marketplace !== marketplace) return false;
      if (toko !== "all" && r.store !== toko) return false;
      if (pengiriman !== "all" && r.kurir !== pengiriman) return false;
      if (range?.from) {
        const d = new Date(r.date);
        const from = new Date(range.from);
        from.setHours(0, 0, 0, 0);
        const to = range.to ? new Date(range.to) : from;
        to.setHours(23, 59, 59, 999);
        if (d < from || d > to) return false;
      }
      if (q) {
        const hay =
          searchField === "pembeli" ? r.buyer.toLowerCase() : r.id.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [items, marketplace, toko, pengiriman, range, search, searchField]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const visibleSelected = paged.filter((r) => selected.has(r.id)).length;
  const allChecked = paged.length > 0 && visibleSelected === paged.length;
  const someChecked = visibleSelected > 0 && !allChecked;
  const totalSelected = selected.size;
  const hasSelection = totalSelected > 0;

  const toggleAll = (checked: boolean) => {
    const next = new Set(selected);
    if (checked) paged.forEach((r) => next.add(r.id));
    else paged.forEach((r) => next.delete(r.id));
    setSelected(next);
  };
  const toggleOne = (id: string, checked: boolean) => {
    const next = new Set(selected);
    if (checked) next.add(id);
    else next.delete(id);
    setSelected(next);
  };

  const isScanAndKirimLabel = (label: string) =>
    label === "Scan & Kirim" || label === "Scan dan Kirim";

  const isPrintLabel = (label: string) =>
    label === "Cetak Label Pengiriman" || label === "Cetak Massal";

  const isProcessLabel = (label: string) => label === "Proses";

  const selectedOrders = items.filter((order) => selected.has(order.id));

  const handleAction = (label: string) => {
    if (isScanAndKirimLabel(label)) {
      navigate({ to: "/pesanan/scan-kirim" });
      return;
    }

    if (isPrintLabel(label) && totalSelected > 0) {
      setIsPrintDialogOpen(true);
      return;
    }

    if (statusLabel === "Menunggu Dicetak" && isProcessLabel(label) && totalSelected > 0) {
      pesananStore.updateStatus(selected, "Menunggu Pickup");
    }

    if (statusLabel === "Menunggu Diproses" && isProcessLabel(label) && totalSelected > 0) {
      pesananStore.updateStatus(selected, "Menunggu Dicetak");
    }

    toast.success(`${label}`, {
      description: `${totalSelected} pesanan diproses (simulasi).`,
    });
    setSelected(new Set());
  };

  const handlePrint = () => {
    const printed = printShippingLabels(selectedOrders);
    if (!printed) {
      toast.error("Gagal membuka jendela cetak. Pastikan popup tidak diblokir.");
      return;
    }

    pesananStore.incrementPrintCount(selected);
    setIsPrintDialogOpen(false);
    toast.success("Cetak Label Pengiriman", {
      description: `${totalSelected} pesanan dicetak (simulasi).`,
    });
    setSelected(new Set());
  };

  const rangeLabel =
    range?.from && range?.to
      ? `${format(range.from, "d MMM", { locale: localeId })} – ${format(range.to, "d MMM yyyy", { locale: localeId })}`
      : range?.from
        ? format(range.from, "d MMM yyyy", { locale: localeId })
        : "Pilih tanggal";

  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1).slice(
    Math.max(0, currentPage - 3),
    Math.max(0, currentPage - 3) + 5,
  );

  return (
    <div className="space-y-6">
      <PageHeader title={title} description={description} />

      {/* Filter tags: Marketplace, Toko, Pengiriman */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={marketplace}
            onValueChange={(v) => {
              setMarketplace(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-9 w-auto min-w-40 gap-2">
              <span className="text-xs text-muted-foreground">Marketplace:</span>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua</SelectItem>
              <SelectItem value="Shopee">Shopee</SelectItem>
              <SelectItem value="Tokopedia">Tokopedia</SelectItem>
              <SelectItem value="TikTok Shop">TikTok Shop</SelectItem>
              <SelectItem value="Lazada">Lazada</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={toko}
            onValueChange={(v) => {
              setToko(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-9 w-auto min-w-40 gap-2">
              <span className="text-xs text-muted-foreground">Toko:</span>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua</SelectItem>
              <SelectItem value="Maqil Official Store">Maqil Official Store</SelectItem>
              <SelectItem value="Maqil Fashion">Maqil Fashion</SelectItem>
              <SelectItem value="Maqil Sport">Maqil Sport</SelectItem>
              <SelectItem value="Maqil Outdoor">Maqil Outdoor</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={pengiriman}
            onValueChange={(v) => {
              setPengiriman(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-9 w-auto min-w-40 gap-2">
              <span className="text-xs text-muted-foreground">Pengiriman:</span>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua</SelectItem>
              <SelectItem value="JNE">JNE</SelectItem>
              <SelectItem value="J&T">J&T</SelectItem>
              <SelectItem value="SiCepat">SiCepat</SelectItem>
              <SelectItem value="AnterAja">AnterAja</SelectItem>
              <SelectItem value="Ninja Xpress">Ninja Xpress</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Search + date filters */}
      <Card className="p-4 space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Select value={searchField} onValueChange={setSearchField}>
            <SelectTrigger className="h-10 w-full sm:w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="no_pesanan">Nomor Pesanan</SelectItem>
              <SelectItem value="pembeli">Nama Pembeli</SelectItem>
              <SelectItem value="sku">SKU</SelectItem>
              <SelectItem value="resi">No. Resi</SelectItem>
            </SelectContent>
          </Select>
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Cari..."
              className="h-10 pl-9"
            />
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "h-10 w-full justify-start text-left font-normal sm:w-60",
                  !range && "text-muted-foreground",
                )}
              >
                <CalendarIcon className="h-4 w-4" />
                {rangeLabel}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="range"
                selected={range}
                onSelect={(r) => {
                  setRange(r);
                  setQuick("all");
                  setPage(1);
                }}
                numberOfMonths={2}
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {quickRanges.map((q) => (
            <Button
              key={q.key}
              size="sm"
              variant={quick === q.key ? "default" : "outline"}
              className="h-8"
              onClick={() => {
                applyQuick(q.key);
                setPage(1);
              }}
            >
              {q.label}
            </Button>
          ))}
        </div>
      </Card>

      {/* Action buttons */}
      {actions.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {actions.map((a) => {
            const isScanAndKirim = isScanAndKirimLabel(a.label);
            return (
              <Button
                key={a.label}
                size="sm"
                variant={a.variant ?? "outline"}
                disabled={!hasSelection && !isScanAndKirim}
                onClick={() => handleAction(a.label)}
                aria-label={a.label}
                title={!hasSelection && !isScanAndKirim ? "Pilih minimal 1 pesanan" : undefined}
              >
                {a.label}
              </Button>
            );
          })}
          <span className="text-xs text-muted-foreground">
            {hasSelection
              ? `${totalSelected} pesanan terpilih`
              : "Pilih minimal 1 pesanan"}
          </span>
        </div>
      )}

      <LabelPreviewDialog
        open={isPrintDialogOpen}
        onOpenChange={setIsPrintDialogOpen}
        orders={selectedOrders}
        onPrint={handlePrint}
      />

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="w-10">
                  <Checkbox
                    checked={allChecked ? true : someChecked ? "indeterminate" : false}
                    onCheckedChange={(v) => toggleAll(v === true)}
                    aria-label="Pilih semua"
                  />
                </TableHead>
                <TableHead className="min-w-[280px]">Produk</TableHead>
                <TableHead>No. Resi Pengiriman</TableHead>
                <TableHead>Pembeli</TableHead>
                <TableHead>Marketplace / Toko</TableHead>
                <TableHead>Kurir</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="py-14 text-center text-sm text-muted-foreground"
                  >
                    Tidak ada pesanan yang cocok dengan filter.
                  </TableCell>
                </TableRow>
              )}
              {paged.map((r: PesananRow) => (
                <TableRow
                  key={r.id}
                  data-state={selected.has(r.id) ? "selected" : undefined}
                >
                  <TableCell>
                    <Checkbox
                      checked={selected.has(r.id)}
                      onCheckedChange={(v) => toggleOne(r.id, v === true)}
                      aria-label={`Pilih ${r.id}`}
                    />
                  </TableCell>
                  <TableCell>
                    <ProductCell
                      productName={r.productName}
                      masterSku={r.masterSku}
                      imageUrl={r.imageUrl}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{(r as any).resi ?? r.id}</TableCell>
                  <TableCell>{r.buyer}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "grid h-7 min-w-7 place-items-center rounded-md px-1.5 text-[10px] font-bold",
                          marketplaceStyle[r.marketplace],
                        )}
                      >
                        {r.marketplace === "TikTok Shop" ? "TT" : r.marketplace[0]}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{r.marketplace}</p>
                        <p className="truncate text-xs text-muted-foreground max-w-[160px]">
                          {r.store}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{r.kurir}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(r.date), "d MMM yyyy", { locale: localeId })}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {idr(r.total)}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <Badge className={cn("font-medium", statusClass)}>
                        {statusLabel}
                      </Badge>
                      {r.printCount > 0 && (
                        <div className="mt-1 flex items-center gap-2 text-[11px] text-emerald-600">
                          <div className="flex items-end gap-[1px]">
                            <span className="h-[12px] w-[1px] bg-emerald-600" />
                            <span className="h-[14px] w-[2px] bg-emerald-500" />
                            <span className="h-[13px] w-[1px] bg-emerald-600" />
                            <span className="h-[12px] w-[2px] bg-emerald-500" />
                            <span className="h-[14px] w-[1px] bg-emerald-600" />
                            <span className="h-[13px] w-[2px] bg-emerald-500" />
                          </div>
                          <span className="font-medium">×{r.printCount}</span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            Menampilkan {paged.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}
            {"–"}
            {(currentPage - 1) * PAGE_SIZE + paged.length} dari {filtered.length} pesanan
          </p>
          <Pagination className="mx-0 w-auto justify-end">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setPage((p) => Math.max(1, p - 1));
                  }}
                  aria-disabled={currentPage === 1}
                  className={cn(currentPage === 1 && "pointer-events-none opacity-50")}
                />
              </PaginationItem>
              {pageNumbers.map((n) => (
                <PaginationItem key={n}>
                  <PaginationLink
                    href="#"
                    isActive={n === currentPage}
                    onClick={(e) => {
                      e.preventDefault();
                      setPage(n);
                    }}
                  >
                    {n}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setPage((p) => Math.min(totalPages, p + 1));
                  }}
                  aria-disabled={currentPage === totalPages}
                  className={cn(
                    currentPage === totalPages && "pointer-events-none opacity-50",
                  )}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </Card>
    </div>
  );
}
