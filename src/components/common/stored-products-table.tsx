import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { useProductsByStatus, type StoredProductStatus } from "@/lib/product-store";

const idr = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);

/**
 * Tabel produk yang dibaca langsung dari `productStore`.
 * Dipakai oleh halaman Live / Draft / Arsip agar seluruh halaman
 * otomatis update tanpa refresh saat produk baru disimpan.
 */
export function StoredProductsTable({
  status,
  statusLabel,
  statusClass,
  emptyMessage,
}: {
  status: StoredProductStatus;
  statusLabel: string;
  statusClass?: string;
  emptyMessage?: string;
}) {
  const rows = useProductsByStatus(status);

  if (rows.length === 0) {
    return (
      <Card className="p-14 text-center text-sm text-muted-foreground">
        {emptyMessage ?? "Belum ada produk pada tab ini."}
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="min-w-[300px]">Produk</TableHead>
              <TableHead>Kategori</TableHead>
              <TableHead className="text-right">Total Stok</TableHead>
              <TableHead className="text-right">Harga Jual</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Marketplace</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((p) => (
              <TableRow key={p.id}>
                <TableCell>
                  <div className="flex gap-3">
                    {p.fotoCover ? (
                      <img
                        src={p.fotoCover}
                        alt={p.namaProduk}
                        className="h-12 w-12 shrink-0 rounded-md border object-cover"
                      />
                    ) : (
                      <div className="h-12 w-12 shrink-0 rounded-md border bg-muted" />
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground line-clamp-2">
                        {p.namaProduk || "(Tanpa nama)"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        SKU: {p.skuInduk || "-"}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {p.kategori || "-"}
                </TableCell>
                <TableCell className="text-right text-sm tabular-nums">
                  {p.stok}
                </TableCell>
                <TableCell className="text-right text-sm tabular-nums">
                  {idr(p.harga)}
                </TableCell>
                <TableCell>
                  <Badge
                    className={cn(
                      "font-medium",
                      statusClass ??
                        "bg-slate-500/10 text-slate-600 dark:text-slate-300 hover:bg-slate-500/10",
                    )}
                  >
                    {statusLabel}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {p.marketplace}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
