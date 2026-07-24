import { createFileRoute } from "@tanstack/react-router";
import { RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
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
import { ProductCell } from "@/components/common/product-cell";
import { masterProducts } from "@/data/products";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/sinkronisasi")({
  head: () => ({ meta: [{ title: "Sinkronisasi — MAQIL.ERP" }] }),
  component: SinkronisasiPage,
});

const channels = ["Shopee", "Tokopedia", "TikTok Shop", "Lazada"] as const;
const types = ["Stok", "Harga", "Produk", "Pesanan"] as const;
const statuses = [
  { label: "Berhasil", cls: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10" },
  { label: "Diproses", cls: "bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10" },
  { label: "Gagal", cls: "bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10" },
];

function SinkronisasiPage() {
  const rows = masterProducts.slice(0, 6).map((p, i) => ({
    product: p,
    time: `18 Jul 2026, ${String(9 + i).padStart(2, "0")}:15`,
    channel: channels[i % channels.length],
    type: types[i % types.length],
    status: statuses[i % statuses.length],
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sinkronisasi"
        description="Riwayat sinkronisasi data dari marketplace."
        actions={
          <Button size="sm">
            <RefreshCw className="h-4 w-4" />
            Sinkron Sekarang
          </Button>
        }
      />
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="min-w-[280px]">Produk</TableHead>
                <TableHead>Waktu</TableHead>
                <TableHead>Kanal</TableHead>
                <TableHead>Tipe</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.product.id}>
                  <TableCell>
                    <ProductCell
                      productName={r.product.name}
                      masterSku={r.product.masterSku}
                      imageUrl={r.product.imageUrl}
                    />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {r.time}
                  </TableCell>
                  <TableCell className="text-sm">{r.channel}</TableCell>
                  <TableCell className="text-sm">{r.type}</TableCell>
                  <TableCell>
                    <Badge className={cn("font-medium", r.status.cls)}>
                      {r.status.label}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
