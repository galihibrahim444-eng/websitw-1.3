import { useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Link as LinkIcon, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useProducts, type StoredProduct } from "@/lib/product-store";
import { useConnectedMarketplaces } from "@/hooks/use-connected-marketplaces";
import type { MarketplaceName } from "@/services/marketplaceAccountService";
import { mappingStore, useMappings } from "@/lib/mapping-store";

export const Route = createFileRoute("/_app/marketplace-mapping/shopee/")({
  head: () => ({
    meta: [
      { title: "Marketplace Mapping — MAQIL.ERP" },
      {
        name: "description",
        content:
          "Kelola mapping SKU ERP dengan SKU marketplace secara terpusat.",
      },
    ],
  }),
  component: MarketplaceMappingPage,
});

function MarketplaceMappingPage() {
  const navigate = useNavigate();
  const products = useProducts();
  const mappings = useMappings();
  const { connectedMarketplaces } = useConnectedMarketplaces();

  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  // Baris tabel: satu baris per SKU (skuInduk + varian bila ada).
  const rows = useMemo(() => {
    const list: { erpSku: string; namaSku: string; product: StoredProduct }[] = [];
    products
      .filter((p) => p.status !== "archive")
      .forEach((p) => {
        if (p.variants && p.variants.length > 0) {
          p.variants.forEach((v) => {
            list.push({
              erpSku: v.sku || p.skuInduk,
              namaSku: p.namaProduk,
              product: p,
            });
          });
        } else {
          list.push({
            erpSku: p.skuInduk,
            namaSku: p.namaProduk,
            product: p,
          });
        }
      });
    return list;
  }, [products]);

  // Hitung jumlah mapping aktif per SKU ERP, dibatasi ke marketplace halaman ini
  // (Shopee) dan di-dedupe berdasarkan target unik supaya tidak double-count.
  const MARKETPLACE_AKTIF: MarketplaceName = "Shopee";
  const countByErpSku = useMemo(() => {
    const perSku = new Map<string, Set<string>>();
    mappings.forEach((m) => {
      if (!m.erpSku || m.status !== "active") return;
      if (m.marketplace !== MARKETPLACE_AKTIF) return;
      const key = `${m.shopId ?? ""}|${m.productId ?? ""}|${m.marketplaceSkuId ?? m.marketplaceSku}`;
      const set = perSku.get(m.erpSku) ?? new Set<string>();
      set.add(key);
      perSku.set(m.erpSku, set);
    });
    const map = new Map<string, number>();
    perSku.forEach((set, sku) => map.set(sku, set.size));
    return map;
  }, [mappings]);


  const allChecked = rows.length > 0 && rows.every((r) => selected[r.erpSku]);

  const toggleAll = (v: boolean) => {
    if (!v) {
      setSelected({});
      return;
    }
    const next: Record<string, boolean> = {};
    rows.forEach((r) => {
      next[r.erpSku] = true;
    });
    setSelected(next);
  };

  const openConnect = (erpSku: string) => {
    navigate({
      to: "/marketplace-mapping/shopee/hubungkan",
      search: { erpSku },
    });
  };

  const handleDelete = (erpSku: string) => {
    mappingStore.removeByErpSku(erpSku);
    toast.success("Mapping dihapus");
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/marketplace-mapping/shopee">Marketplace Mapping</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Shopee</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <PageHeader
        title="Marketplace Mapping"
        description="Hubungkan setiap SKU ERP dengan SKU di marketplace."
      />

      <Card className="overflow-hidden">
        <div className="max-h-[calc(100vh-16rem)] overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-muted/40 shadow-[inset_0_-1px_0_hsl(var(--border))]">
              <TableRow className="hover:bg-muted/40">
                <TableHead className="w-10">
                  <Checkbox
                    checked={allChecked}
                    onCheckedChange={(v) => toggleAll(!!v)}
                    aria-label="Pilih semua"
                  />
                </TableHead>
                <TableHead className="min-w-[180px]">Nomor SKU ERP</TableHead>
                <TableHead className="min-w-[240px]">Nama SKU ERP</TableHead>
                <TableHead>Marketplace</TableHead>
                <TableHead>Status Mapping</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 && (
                <TableRow className="h-14">
                  <TableCell
                    colSpan={6}
                    className="py-10 text-center text-sm text-muted-foreground"
                  >
                    Belum ada SKU untuk dimapping.
                  </TableCell>
                </TableRow>
              )}
              {rows.map((r) => {
                const count = r.erpSku ? countByErpSku.get(r.erpSku) ?? 0 : 0;
                return (
                  <TableRow key={r.erpSku} className="h-14">
                    <TableCell>
                      <Checkbox
                        checked={!!selected[r.erpSku]}
                        onCheckedChange={(v) =>
                          setSelected((s) => ({ ...s, [r.erpSku]: !!v }))
                        }
                        aria-label={`Pilih ${r.erpSku}`}
                      />
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {r.erpSku || "-"}
                    </TableCell>
                    <TableCell className="text-sm">{r.namaSku}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {connectedMarketplaces.length === 0 ? (
                          <span className="text-xs text-muted-foreground">
                            —
                          </span>
                        ) : (
                          connectedMarketplaces.map((m) => (
                            <Badge key={m} variant="outline" className="text-xs">
                              {m}
                            </Badge>
                          ))
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {count === 0 ? (
                        <Badge className="bg-red-500/10 text-red-600 hover:bg-red-500/10 dark:text-red-400">
                          Belum Terhubung
                        </Badge>
                      ) : (
                        <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/10 dark:text-emerald-400">
                          Sudah Terhubung ({count})
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openConnect(r.erpSku)}
                            >
                              <LinkIcon className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Hubungkan Mapping</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-600 hover:bg-red-500/10 hover:text-red-600 dark:text-red-400"
                              onClick={() => setDeleteTarget(r.erpSku)}
                              disabled={count === 0}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Hapus Mapping</TooltipContent>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </Card>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Mapping</AlertDialogTitle>
            <AlertDialogDescription>
              Mapping SKU {deleteTarget} akan dihapus. Anda dapat menghubungkan
              ulang kapan saja.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && handleDelete(deleteTarget)}
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
