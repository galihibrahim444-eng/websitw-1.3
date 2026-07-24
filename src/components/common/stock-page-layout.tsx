import { useState, type ReactNode } from "react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { CalendarIcon, Plus, Search } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
import { cn } from "@/lib/utils";
import type { DateRange } from "react-day-picker";
import { ProductCell } from "@/components/common/product-cell";
import { masterProducts } from "@/data/products";

export type ColumnDef = { key: string; label: string; className?: string };

const gudangOptions = [
  { value: "all", label: "Semua Gudang" },
  { value: "utama", label: "Gudang Utama" },
  { value: "cabang", label: "Gudang Cabang" },
  { value: "retur", label: "Gudang Retur" },
];

function sampleValue(key: string, p: typeof masterProducts[number], i: number): string {
  const dates = ["18 Jul 2026", "17 Jul 2026", "16 Jul 2026", "15 Jul 2026", "14 Jul 2026", "12 Jul 2026"];
  const docs = ["ADD", "SUB", "OPN", "STK"];
  const doc = `${docs[i % docs.length]}-${String(1050 + i).padStart(5, "0")}`;
  const gudang = ["Gudang Utama", "Gudang Cabang", "Gudang Retur"][i % 3];
  const marketplace = ["Shopee", "Tokopedia", "TikTok Shop", "Lazada"][i % 4];
  const qty = 10 + i * 3;
  const tersedia = Math.max(0, p.stock - qty);
  const status = ["Selesai", "Diproses", "Diverifikasi"][i % 3];
  switch (key) {
    case "no": return doc;
    case "tanggal": return dates[i % dates.length];
    case "gudang": return gudang;
    case "sku": return p.masterSku;
    case "produk": return p.name;
    case "marketplace": return marketplace;
    case "tersedia": return String(tersedia);
    case "dipesan": return String(qty);
    case "total": return String(p.stock);
    case "qty": return String(qty);
    case "petugas": return ["Andi", "Rina", "Budi", "Sinta"][i % 4];
    case "selisih": return (i % 2 === 0 ? "+" : "-") + (i + 1);
    case "status": return status;
    case "catatan": return i % 2 === 0 ? "-" : "Batch reguler";
    default: return "—";
  }
}

export function StockPageLayout({
  title,
  description,
  actionLabel,
  searchPlaceholder,
  columns,
  extraFilter,
  showDateFilter = true,
  emptyMessage = "Belum ada data. Hubungkan ke backend untuk melihat data sebenarnya.",
}: {
  title: string;
  description: string;
  actionLabel?: string;
  searchPlaceholder: string;
  columns: ColumnDef[];
  extraFilter?: ReactNode;
  showDateFilter?: boolean;
  emptyMessage?: string;
}) {
  const [search, setSearch] = useState("");
  const [gudang, setGudang] = useState("all");
  const [range, setRange] = useState<DateRange | undefined>();

  const rangeLabel =
    range?.from && range?.to
      ? `${format(range.from, "d MMM", { locale: localeId })} – ${format(range.to, "d MMM yyyy", { locale: localeId })}`
      : range?.from
        ? format(range.from, "d MMM yyyy", { locale: localeId })
        : "Pilih tanggal";

  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        description={description}
        actions={
          actionLabel ? (
            <Button size="sm">
              <Plus className="h-4 w-4" />
              {actionLabel}
            </Button>
          ) : undefined
        }
      />

      <Card className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="h-10 pl-9"
            />
          </div>
          <Select value={gudang} onValueChange={setGudang}>
            <SelectTrigger className="h-10 w-full sm:w-48">
              <SelectValue placeholder="Semua Gudang" />
            </SelectTrigger>
            <SelectContent>
              {gudangOptions.map((g) => (
                <SelectItem key={g.value} value={g.value}>
                  {g.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {extraFilter}
          {showDateFilter && (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "h-10 w-full justify-start text-left font-normal sm:w-64",
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
                  onSelect={setRange}
                  numberOfMonths={2}
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          )}
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="min-w-[280px]">Produk</TableHead>
                {columns.map((c) => (
                  <TableHead key={c.key} className={c.className}>
                    {c.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {masterProducts.slice(0, 6).map((p, i) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <ProductCell
                      productName={p.name}
                      masterSku={p.masterSku}
                      imageUrl={p.imageUrl}
                    />
                  </TableCell>
                  {columns.map((c) => (
                    <TableCell key={c.key} className={c.className}>
                      <span className="text-sm text-muted-foreground">
                        {sampleValue(c.key, p, i)}
                      </span>
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}

export function MarketplaceFilter() {
  const [value, setValue] = useState("all");
  return (
    <Select value={value} onValueChange={setValue}>
      <SelectTrigger className="h-10 w-full sm:w-52">
        <SelectValue placeholder="Semua Marketplace" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Semua Marketplace</SelectItem>
        <SelectItem value="Shopee">Shopee</SelectItem>
        <SelectItem value="Tokopedia">Tokopedia</SelectItem>
        <SelectItem value="TikTok Shop">TikTok Shop</SelectItem>
        <SelectItem value="Lazada">Lazada</SelectItem>
      </SelectContent>
    </Select>
  );
}
