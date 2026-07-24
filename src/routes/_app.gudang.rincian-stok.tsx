import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { cn } from "@/lib/utils";
import {
  useProductsByStatus,
  DEFAULT_MINIMUM_STOCK,
  type StoredProduct,
  type StoredVariant,
} from "@/lib/product-store";

export const Route = createFileRoute("/_app/gudang/rincian-stok")({
  head: () => ({
    meta: [
      { title: "Stok Produk — MAQIL.ERP" },
      {
        name: "description",
        content:
          "Viewer stok produk ERP realtime — dibaca langsung dari Master Produk.",
      },
    ],
  }),
  component: StokProdukPage,
});

type StatusStok = "aktif" | "menipis" | "habis";

type Row = {
  key: string;
  productId: string;
  imageUrl: string | null;
  sku: string;
  namaProduk: string;
  variasi: string;
  stok: number;
  status: StatusStok;
};

function statusFor(stok: number, min: number): StatusStok {
  if (stok <= 0) return "habis";
  if (stok <= min) return "menipis";
  return "aktif";
}

function flatten(products: StoredProduct[]): Row[] {
  const rows: Row[] = [];
  for (const p of products) {
    const min = p.minimumStock ?? DEFAULT_MINIMUM_STOCK;
    if (p.variants && p.variants.length > 0) {
      p.variants.forEach((v: StoredVariant, i) => {
        rows.push({
          key: `${p.id}-${i}`,
          productId: p.id,
          imageUrl: v.gambar || p.fotoCover || null,
          sku: v.sku || p.skuInduk || "-",
          namaProduk: p.namaProduk || "(Tanpa nama)",
          variasi: variantLabel(v, i),
          stok: v.stok ?? 0,
          status: statusFor(v.stok ?? 0, min),
        });
      });
    } else {
      rows.push({
        key: p.id,
        productId: p.id,
        imageUrl: p.fotoCover,
        sku: p.skuInduk || "-",
        namaProduk: p.namaProduk || "(Tanpa nama)",
        variasi: "-",
        stok: p.stok ?? 0,
        status: statusFor(p.stok ?? 0, min),
      });
    }
  }
  return rows;
}

function variantLabel(v: StoredVariant, i: number): string {
  // Nama variasi tidak selalu tersimpan di StoredVariant; fallback ke SKU suffix.
  const anyV = v as StoredVariant & { nama?: string; name?: string };
  return anyV.nama || anyV.name || v.sku || `Variasi ${i + 1}`;
}

const STATUS_META: Record<
  StatusStok,
  { label: string; className: string }
> = {
  aktif: {
    label: "Aktif",
    className:
      "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10",
  },
  menipis: {
    label: "Stok Menipis",
    className:
      "bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10",
  },
  habis: {
    label: "Habis",
    className:
      "bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/10",
  },
};

function StokProdukPage() {
  const liveProducts = useProductsByStatus("live");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | StatusStok>("all");

  const rows = useMemo(() => flatten(liveProducts), [liveProducts]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (status !== "all" && r.status !== status) return false;
      if (!q) return true;
      return (
        r.sku.toLowerCase().includes(q) ||
        r.namaProduk.toLowerCase().includes(q) ||
        r.variasi.toLowerCase().includes(q)
      );
    });
  }, [rows, search, status]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Stok Produk"
        description="Viewer stok realtime dari Master Produk ERP (Produk → Live)."
      />

      <Card className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama produk, SKU, atau variasi..."
              className="h-10 pl-9"
            />
          </div>
          <Select
            value={status}
            onValueChange={(v) => setStatus(v as typeof status)}
          >
            <SelectTrigger className="h-10 w-full sm:w-48">
              <SelectValue placeholder="Semua Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="aktif">Aktif</SelectItem>
              <SelectItem value="menipis">Stok Menipis</SelectItem>
              <SelectItem value="habis">Habis</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="w-[76px]">Foto</TableHead>
                <TableHead className="min-w-[180px]">Nomor SKU ERP</TableHead>
                <TableHead className="min-w-[240px]">Nama Produk</TableHead>
                <TableHead className="min-w-[180px]">Variasi</TableHead>
                <TableHead className="text-right">Stok Tersedia</TableHead>
                <TableHead>Status Stok</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-14 text-center text-sm text-muted-foreground"
                  >
                    Belum ada produk pada tampilan ini.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((r) => (
                  <TableRow key={r.key}>
                    <TableCell>
                      {r.imageUrl ? (
                        <img
                          src={r.imageUrl}
                          alt={r.namaProduk}
                          className="h-12 w-12 rounded-md border object-cover"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-md border bg-muted" />
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {r.sku}
                    </TableCell>
                    <TableCell className="text-sm font-medium text-foreground">
                      {r.namaProduk}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {r.variasi}
                    </TableCell>
                    <TableCell className="text-right text-sm tabular-nums">
                      {r.stok}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={cn(
                          "font-medium",
                          STATUS_META[r.status].className,
                        )}
                      >
                        {STATUS_META[r.status].label}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
