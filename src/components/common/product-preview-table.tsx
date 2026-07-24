import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Sparkles, Settings2 } from "lucide-react";
import { ProductCell } from "@/components/common/product-cell";
import { CreateMasterSkuDialog } from "@/components/common/create-master-sku-dialog";
import { masterProducts, type MasterProduct } from "@/data/products";
import { cn } from "@/lib/utils";

const idr = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);

export function ProductPreviewTable({
  statusLabel,
  statusClass,
  emptyMessage,
  rightColumnLabel = "Harga Jual",
  filterStatus,
}: {
  statusLabel?: string;
  statusClass?: string;
  emptyMessage?: string;
  rightColumnLabel?: string;
  filterStatus?: MasterProduct["productStatus"];
}) {
  const [dialogProduct, setDialogProduct] = useState<MasterProduct | null>(null);
  const [dialogMode, setDialogMode] = useState<"create" | "manage">("create");

  const rows = (filterStatus
    ? masterProducts.filter((p) => p.productStatus === filterStatus)
    : masterProducts
  ).slice(0, 6);

  if (emptyMessage || rows.length === 0) {
    return (
      <Card className="p-14 text-center text-sm text-muted-foreground">
        {emptyMessage ?? "Tidak ada produk pada tab ini."}
      </Card>
    );
  }

  return (
    <>
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="min-w-[300px]">Produk</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead className="text-right">Total Stok</TableHead>
                <TableHead className="text-right">{rightColumnLabel}</TableHead>
                {statusLabel && <TableHead>Status</TableHead>}
                <TableHead>Sinkronisasi</TableHead>
                <TableHead className="w-56 text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <ProductCell
                      productName={p.name}
                      masterSku={p.masterSku}
                      imageUrl={p.imageUrl}
                      marketplaceCount={p.marketplaceCount}
                    />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {p.category}
                  </TableCell>
                  <TableCell className="text-right text-sm tabular-nums">
                    {p.stock}
                  </TableCell>
                  <TableCell className="text-right text-sm tabular-nums text-foreground">
                    {idr(p.price)}
                  </TableCell>
                  {statusLabel && (
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
                  )}
                  <TableCell>
                    {p.syncStatus === "created" ? (
                      <Badge className="gap-1.5 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/10 dark:text-emerald-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Master SKU Dibuat
                      </Badge>
                    ) : (
                      <Badge className="gap-1.5 bg-rose-500/10 text-rose-600 hover:bg-rose-500/10 dark:text-rose-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                        Belum Aktif
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {p.syncStatus === "created" ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setDialogProduct(p);
                          setDialogMode("manage");
                        }}
                      >
                        <Settings2 className="h-4 w-4" />
                        Kelola Master SKU
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => {
                          setDialogProduct(p);
                          setDialogMode("create");
                        }}
                      >
                        <Sparkles className="h-4 w-4" />
                        Buat Master SKU
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
      <CreateMasterSkuDialog
        product={dialogProduct}
        mode={dialogMode}
        open={!!dialogProduct}
        onOpenChange={(o) => !o && setDialogProduct(null)}
      />
    </>
  );
}
