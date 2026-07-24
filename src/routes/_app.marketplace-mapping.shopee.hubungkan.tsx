import { useEffect, useMemo, useState } from "react";
import {
  createFileRoute,
  Link,
  useNavigate,
  useSearch,
} from "@tanstack/react-router";
import { ArrowLeft, ChevronRight, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
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
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { cn } from "@/lib/utils";
import { useProducts, type StoredProduct } from "@/lib/product-store";
import { useConnectedMarketplaces } from "@/hooks/use-connected-marketplaces";
import { useMarketplaceShops } from "@/hooks/use-marketplace-shops";
import type { MarketplaceName } from "@/services/marketplaceAccountService";
import {
  MarketplaceProductService,
  type MarketplaceProduct,
} from "@/services/marketplaceProductService";
import { mappingStore, useMappings } from "@/lib/mapping-store";


interface ErpSkuPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rows: ErpRow[];
  value?: string;
  onSelect: (erpSku: string) => void;
}

function ErpSkuPickerDialog({
  open,
  onOpenChange,
  rows,
  value,
  onSelect,
}: ErpSkuPickerDialogProps) {
  const [searchSku, setSearchSku] = useState("");
  const [pending, setPending] = useState<string | undefined>(value);

  useEffect(() => {
    if (open) {
      setPending(value);
      setSearchSku("");
    }
  }, [open, value]);

  const filtered = useMemo(() => {
    const qSku = searchSku.trim().toLowerCase();
    return rows.filter((r) => {
      return !qSku || r.erpSku.toLowerCase().includes(qSku);
    });
  }, [rows, searchSku]);

  const confirm = (erpSku?: string) => {
    const v = erpSku ?? pending;
    if (!v) return;
    onSelect(v);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] max-w-2xl flex-col gap-4 p-0">
        <DialogHeader className="border-b px-5 pb-3 pt-5">
          <DialogTitle>Pilih SKU ERP</DialogTitle>
        </DialogHeader>

        <div className="px-5">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchSku}
              onChange={(e) => setSearchSku(e.target.value)}
              placeholder="Cari nomor SKU ERP..."
              className="pl-8"
            />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto border-t">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              SKU ERP tidak ditemukan.
            </div>
          ) : (
            <div className="divide-y">
              {filtered.map((r) => {
                const active = pending === r.erpSku;
                return (
                  <button
                    key={r.erpSku}
                    type="button"
                    onClick={() => setPending(r.erpSku)}
                    onDoubleClick={() => confirm(r.erpSku)}
                    className={cn(
                      "flex w-full items-center gap-3 border-l-2 border-transparent px-4 py-3 text-left transition-colors hover:bg-muted/40",
                      active && "border-l-primary bg-primary/5 hover:bg-primary/5",
                    )}
                  >
                    <span className="font-mono text-sm">{r.erpSku}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <DialogFooter className="border-t px-5 pb-5 pt-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button disabled={!pending} onClick={() => confirm()}>
            Pilih
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type StatusFilter = "all" | "connected" | "unconnected";

interface SearchParams {
  erpSku?: string;
}

export const Route = createFileRoute("/_app/marketplace-mapping/shopee/hubungkan")({
  validateSearch: (search: Record<string, unknown>): SearchParams => ({
    erpSku: typeof search.erpSku === "string" ? search.erpSku : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Hubungkan SKU Marketplace — MAQIL.ERP" },
      {
        name: "description",
        content:
          "Hubungkan SKU ERP dengan SKU yang ada di marketplace dalam satu halaman.",
      },
    ],
  }),
  component: HubungkanMappingPage,
});

type ErpRow = {
  erpSku: string;
  namaSku: string;
  variation: string;
  product: StoredProduct;
};

function HubungkanMappingPage() {
  const navigate = useNavigate();
  const { erpSku: erpSkuParam } = useSearch({
    from: "/_app/marketplace-mapping/shopee/hubungkan",
  });
  const products = useProducts();
  const mappings = useMappings();
  const { connectedMarketplaces } = useConnectedMarketplaces();

  const [marketplace, setMarketplace] = useState<MarketplaceName>("Shopee");
  const [shopId, setShopId] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState<string>("");

  const { shops } = useMarketplaceShops(marketplace);

  const [mpProducts, setMpProducts] = useState<MarketplaceProduct[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    MarketplaceProductService.list({
      marketplace,
      shopId: shopId === "all" ? undefined : Number(shopId),
      search,
    })
      .then((data) => {
        if (!cancelled) setMpProducts(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [marketplace, shopId, search]);

  const erpRows = useMemo<ErpRow[]>(() => {
    const list: ErpRow[] = [];
    products
      .filter((p) => p.status !== "archive")
      .forEach((p) => {
        if (p.variants && p.variants.length > 0) {
          p.variants.forEach((v) => {
            list.push({
              erpSku: v.sku || p.skuInduk,
              namaSku: p.namaProduk,
              variation: "-",
              product: p,
            });
          });
        } else {
          list.push({
            erpSku: p.skuInduk,
            namaSku: p.namaProduk,
            variation: "-",
            product: p,
          });
        }
      });
    return list.filter((r) => r.erpSku);
  }, [products]);

  const erpBySku = useMemo(() => {
    const map = new Map<string, ErpRow>();
    erpRows.forEach((r) => map.set(r.erpSku, r));
    return map;
  }, [erpRows]);

  const defaultErpSku = erpSkuParam || erpRows[0]?.erpSku || "";

  type SelectedItem = {
    product: MarketplaceProduct;
    targetErpSku: string;
  };

  const [selected, setSelected] = useState<Record<string, SelectedItem>>({});

  const keyOf = (p: MarketplaceProduct) => `${p.itemId}-${p.skuId}`;
  const isSelected = (p: MarketplaceProduct) => Boolean(selected[keyOf(p)]);

  const toggleSelect = (p: MarketplaceProduct, checked: boolean) => {
    setSelected((prev) => {
      const next = { ...prev };
      const k = keyOf(p);
      if (checked) {
        next[k] = { product: p, targetErpSku: defaultErpSku };
      } else {
        delete next[k];
      }
      return next;
    });
  };

  const removeSelected = (p: MarketplaceProduct) => {
    setSelected((prev) => {
      const next = { ...prev };
      delete next[keyOf(p)];
      return next;
    });
  };

  const updateTargetErpSku = (p: MarketplaceProduct, erpSku: string) => {
    setSelected((prev) => {
      const k = keyOf(p);
      if (!prev[k]) return prev;
      return { ...prev, [k]: { ...prev[k], targetErpSku: erpSku } };
    });
  };

  const [pickerFor, setPickerFor] = useState<string | null>(null);
  const pickerItem = pickerFor ? selected[pickerFor] : undefined;

  const mappedKeys = useMemo(() => {
    const set = new Set<string>();
    mappings.forEach((m) => {
      if (m.marketplaceSkuId) set.add(`${m.productId ?? ""}-${m.marketplaceSkuId}`);
    });
    return set;
  }, [mappings]);

  // Prefill panel kanan dengan produk yang sudah terhubung ke SKU ERP ini,
  // supaya produk yang sudah termapping tidak muncul lagi di panel kiri.
  useEffect(() => {
    if (!erpSkuParam || mpProducts.length === 0) return;
    const connectedKeys = new Set(
      mappings
        .filter(
          (m) =>
            m.erpSku === erpSkuParam &&
            m.marketplace === marketplace &&
            m.status === "active",
        )
        .map((m) => `${m.productId ?? ""}-${m.marketplaceSkuId ?? ""}`),
    );
    if (connectedKeys.size === 0) return;
    setSelected((prev) => {
      const next = { ...prev };
      let changed = false;
      mpProducts.forEach((p) => {
        const k = keyOf(p);
        if (connectedKeys.has(k) && !next[k]) {
          next[k] = { product: p, targetErpSku: erpSkuParam };
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [erpSkuParam, marketplace, mpProducts, mappings]);

  const filteredProducts = useMemo(() => {
    if (statusFilter === "all") return mpProducts;
    return mpProducts.filter((p) => {
      const isMapped = mappedKeys.has(`${p.itemId}-${p.skuId}`);
      return statusFilter === "connected" ? isMapped : !isMapped;
    });
  }, [mpProducts, statusFilter, mappedKeys]);

  const selectedList = Object.values(selected);
  const visibleProducts = useMemo(
    () => filteredProducts.filter((p) => !selected[keyOf(p)]),
    [filteredProducts, selected],
  );
  const canConfirm =
    selectedList.length > 0 && selectedList.every((s) => s.targetErpSku);

  const handleConfirm = () => {
    if (!canConfirm) return;
    // Kelompokkan hasil pilihan per SKU ERP tujuan, lalu sinkronkan
    // (replace) mapping untuk kombinasi (erpSku, marketplace) tsb.
    // Ini memastikan item yang dihapus di panel kanan benar-benar
    // hilang dari mappingStore — bukan sekadar di-append.
    const groups = new Map<string, typeof selectedList>();
    selectedList.forEach((s) => {
      const arr = groups.get(s.targetErpSku) ?? [];
      arr.push(s);
      groups.set(s.targetErpSku, arr);
    });
    groups.forEach((items, targetErpSku) => {
      mappingStore.replaceForErpSkuAndMarketplace(
        targetErpSku,
        marketplace,
        items.map((s) => ({
          erpSku: targetErpSku,
          marketplace: s.product.marketplace,
          shopId: s.product.shopId,
          shopName: s.product.shopName,
          productId: s.product.itemId,
          marketplaceSkuId: s.product.skuId,
          marketplaceSku: s.product.marketplaceSku,
          variation: s.product.variation,
          status: "active",
        })),
      );
    });
    // Jika halaman dibuka untuk erpSku tertentu tapi user mengosongkan
    // semua pilihan, tetap sinkronkan agar mapping lama ikut terhapus.
    if (erpSkuParam && !groups.has(erpSkuParam)) {
      mappingStore.replaceForErpSkuAndMarketplace(erpSkuParam, marketplace, []);
    }
    toast.success(`${selectedList.length} mapping berhasil disimpan`);
    navigate({ to: "/marketplace-mapping/shopee" });
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col gap-4 pb-24">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/marketplace-mapping/shopee">Marketplace Mapping</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Hubungkan SKU Marketplace</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex items-start gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate({ to: "/marketplace-mapping/shopee" })}
          aria-label="Kembali"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-semibold">Hubungkan SKU Marketplace</h1>
          <p className="text-sm text-muted-foreground">
            Hubungkan SKU ERP dengan SKU yang ada di marketplace.
          </p>
        </div>
      </div>

      {/* Filter row */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="grid gap-1.5 w-full sm:w-48">
          <Label className="text-xs">Marketplace</Label>
          <Select
            value={marketplace}
            onValueChange={(v) => setMarketplace(v as MarketplaceName)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(connectedMarketplaces.length > 0
                ? connectedMarketplaces
                : (["Shopee"] as MarketplaceName[])
              ).map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-1.5 w-full sm:w-56">
          <Label className="text-xs">Toko</Label>
          <Select value={shopId} onValueChange={setShopId}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Toko</SelectItem>
              {shops.map((s) => (
                <SelectItem key={s.shopId} value={String(s.shopId)}>
                  {s.shopName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-1.5 w-full sm:w-52">
          <Label className="text-xs">Status</Label>
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as StatusFilter)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua</SelectItem>
              <SelectItem value="unconnected">Belum Terhubung</SelectItem>
              <SelectItem value="connected">Sudah Terhubung</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-1.5 flex-1 min-w-[220px]">
          <Label className="text-xs">Pencarian</Label>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama produk, SKU, atau Item ID..."
              className="pl-8"
            />
          </div>
        </div>
      </div>

      {/* Two panels */}
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(380px,480px)]">
        {/* PANEL KIRI */}
        <Card className="flex min-h-0 flex-col overflow-hidden">
          <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-card px-4 py-3">
            <div>
              <h2 className="text-sm font-semibold">Produk Marketplace</h2>
              <p className="text-xs text-muted-foreground">
                {visibleProducts.length} produk tersedia
              </p>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="divide-y">
              {loading && (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  Memuat produk marketplace...
                </div>
              )}
              {!loading && visibleProducts.length === 0 && (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  Tidak ada produk yang cocok dengan filter.
                </div>
              )}
              {visibleProducts.map((p) => {
                const mapped = mappedKeys.has(`${p.itemId}-${p.skuId}`);
                const active = isSelected(p);
                return (
                  <label
                    key={keyOf(p)}
                    className={cn(
                      "flex cursor-pointer items-start gap-3 border-l-2 border-transparent p-3 transition-colors hover:bg-muted/40",
                      active && "border-l-primary bg-primary/5 hover:bg-primary/5",
                    )}
                  >
                    <Checkbox
                      checked={active}
                      onCheckedChange={(v) => toggleSelect(p, !!v)}
                      className="mt-1"
                    />
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded border bg-muted">
                      {p.image && (
                        <img
                          src={p.image}
                          alt={p.name}
                          className="h-full w-full object-cover"
                        />
                      )}
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="line-clamp-2 text-sm font-medium leading-snug">
                          {p.name}
                        </div>
                        {mapped && (
                          <Badge
                            variant="secondary"
                            className="shrink-0 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          >
                            Terhubung
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
                        <span>
                          Item ID: <span className="font-mono">{p.itemId}</span>
                        </span>
                        <span>Toko: {p.shopName}</span>
                        <span>
                          SKU ID: <span className="font-mono">{p.skuId}</span>
                        </span>
                        <span>Variasi: {p.variation ?? "-"}</span>
                      </div>

                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        </Card>

        {/* PANEL KANAN */}
        <Card className="flex min-h-0 flex-col overflow-hidden">
          <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-card px-4 py-3">
            <div>
              <h2 className="text-sm font-semibold">SKU yang Akan Dihubungkan</h2>
              <p className="text-xs text-muted-foreground">
                {selectedList.length} produk dipilih
              </p>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {selectedList.length === 0 ? (
              <div className="flex h-full items-center justify-center p-8">
                <p className="max-w-xs text-center text-sm text-muted-foreground">
                  Pilih produk dari panel kiri untuk mulai membuat mapping.
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {selectedList.map(({ product: p, targetErpSku }) => {
                  const erp = erpBySku.get(targetErpSku);
                  return (
                    <div key={keyOf(p)} className="space-y-2 p-3">
                      <div className="flex items-start gap-3">
                        <div className="h-12 w-12 shrink-0 overflow-hidden rounded border bg-muted">
                          {p.image && (
                            <img
                              src={p.image}
                              alt={p.name}
                              className="h-full w-full object-cover"
                            />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="line-clamp-2 text-sm font-medium leading-snug">
                            {p.name}
                          </div>
                          <div className="mt-0.5 flex flex-wrap gap-x-2 text-xs text-muted-foreground">
                            <span>{p.marketplace}</span>
                            <span>•</span>
                            <span>{p.shopName}</span>
                          </div>
                          <div className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                            <div>
                              Item ID : <span className="font-mono">{p.itemId}</span>
                            </div>
                            <div>
                              SKU Marketplace :{" "}
                              <span className="font-mono">{p.marketplaceSku}</span>
                            </div>
                            <div>Variasi : {p.variation ?? "-"}</div>
                          </div>
                        </div>
                      </div>

                      <div className="grid gap-1.5">
                        <Label className="text-xs">Hubungkan ke SKU ERP</Label>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setPickerFor(keyOf(p))}
                          className="h-9 w-full justify-between font-normal"
                        >
                          <span className={cn(!erp && "text-muted-foreground")}>
                            {erp ? (
                              <span className="font-mono">{erp.erpSku}</span>
                            ) : (
                              "Pilih SKU ERP"
                            )}
                          </span>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </div>

                      <div className="flex justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-red-600 hover:bg-red-500/10 hover:text-red-600 dark:text-red-400"
                          onClick={() => removeSelected(p)}
                        >
                          <Trash2 className="mr-1 h-4 w-4" />
                          Hapus
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Sticky Footer */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="flex items-center justify-between gap-3 px-6 py-3">
          <p className="text-xs text-muted-foreground">
            {selectedList.length} produk siap dihubungkan
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => navigate({ to: "/marketplace-mapping/shopee" })}
            >
              Batal
            </Button>
            <Button disabled={!canConfirm} onClick={handleConfirm}>
              Konfirmasi
            </Button>
          </div>
        </div>
      </div>

      <ErpSkuPickerDialog
        open={pickerFor !== null}
        onOpenChange={(o) => {
          if (!o) setPickerFor(null);
        }}
        rows={erpRows}
        value={pickerItem?.targetErpSku}
        onSelect={(erpSku) => {
          if (pickerItem) updateTargetErpSku(pickerItem.product, erpSku);
        }}
      />
    </div>
  );
}
