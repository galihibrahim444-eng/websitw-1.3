import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { CopyProductDialog } from "@/components/produk/copy-product-dialog";
import { duplicateProduct } from "@/lib/product-duplicator";
import { useBackendProducts } from "@/hooks/use-backend-products";
import {
  Search,
  Edit,
  Copy,
  Trash2,
  RefreshCw,
  MoreHorizontal,
  ChevronDown,
  Plus,
  HelpCircle,
  Archive,
  Wallet,
} from "lucide-react";
import { EditPriceDialog } from "@/components/produk/edit-price-dialog";
import { InlinePriceCell } from "@/components/produk/inline-price-cell";
import { PageHeader } from "@/components/common/page-header";
import { useConnectedMarketplaces } from "@/hooks/use-connected-marketplaces";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  PRODUCT_STATUS_TABS,
  PRODUCT_STATUS,
  type ProductStatus,
} from "@/lib/product-status";
import {
  useProducts,
  productStore,
  isLowStock,
  hasInStock,
  hasOutOfStock,
  type StoredProduct,
  type StoredProductStatus,
  type StoredVariant,
} from "@/lib/product-store";
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

const ALL_TAB = "Semua" as const;
type MarketplaceTab =
  | typeof ALL_TAB
  | import("@/services/marketplaceAccountService").MarketplaceName;


const hash = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
};
const salesFor = (sku: string) => 20 + (hash(sku) % 200);
const favFor = (sku: string) => 5 + (hash(sku + "f") % 90);
const viewsFor = (sku: string) => 100 + (hash(sku + "v") % 700);

const fmtDate = (t: number) =>
  new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(t));

function getErpStatus(p: StoredProduct): ProductStatus {
  if (p.status === "archive") return PRODUCT_STATUS.DIHAPUS;
  if (p.status === "draft") return PRODUCT_STATUS.DISIAPKAN;
  if ((p.stok ?? 0) <= 0) return PRODUCT_STATUS.HABIS;
  return PRODUCT_STATUS.AKTIF;
}

/**
 * Apakah produk cocok dengan tab status yang dipilih.
 *
 * Untuk produk Live, tab Aktif / Habis / Stok Menipis dievaluasi
 * PER VARIASI, sehingga satu produk bisa muncul di beberapa tab sekaligus:
 *  - Aktif        : minimal ada satu variasi dengan stok > 0
 *  - Habis        : ada variasi dengan stok = 0
 *  - Stok Menipis : ada variasi dengan 0 < stok <= minimumStock
 *
 * Untuk produk Draft/Arsip, tetap gunakan status penyimpanan.
 */
function matchesStatusTab(p: StoredProduct, tab: ProductStatus): boolean {
  if (p.status === "live") {
    if (tab === PRODUCT_STATUS.AKTIF) return hasInStock(p);
    if (tab === PRODUCT_STATUS.HABIS) return hasOutOfStock(p);
    if (tab === PRODUCT_STATUS.DIPERIKSA) return isLowStock(p);
    return false;
  }
  return getErpStatus(p) === tab;
}

export type ProductTableViewProps = {
  title: string;
  description: string;
  /** Filter opsional berdasar status penyimpanan (draft/live/archive). */
  statusFilter?: StoredProductStatus;
};

export function ProductTableView({
  title,
  description,
  statusFilter,
}: ProductTableViewProps) {
  const { connectedMarketplaces } = useConnectedMarketplaces();
  const marketplaceTabs: MarketplaceTab[] = [ALL_TAB, ...connectedMarketplaces];
  const [marketplace, setMarketplace] = useState<MarketplaceTab>(ALL_TAB);
  const [statusTab, setStatusTab] = useState<ProductStatus>("aktif");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [copySourceId, setCopySourceId] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [archiveTargetId, setArchiveTargetId] = useState<string | null>(null);
  const [activateDialogOpen, setActivateDialogOpen] = useState(false);
  const [editPriceId, setEditPriceId] = useState<string | null>(null);
  const navigate = useNavigate();

  // Aktifkan tab "Stok Menipis" bila URL berisi ?filter=low-stock
  // (dipakai oleh toast notifikasi Stok Menipis).
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("filter") === "low-stock") {
      setStatusTab(PRODUCT_STATUS.DIPERIKSA);
    }
  }, []);

  const backendProducts = useBackendProducts();
  const all = backendProducts ?? useProducts();

  // Sumber utama: backend products jika tersedia, atau productStore sebagai fallback.
  const base = statusFilter ? all.filter((p) => p.status === statusFilter) : all;

  const marketplaceScoped = base.filter(
    (p) => marketplace === ALL_TAB || p.marketplace === marketplace,
  );

  const statusCounts = PRODUCT_STATUS_TABS.reduce(
    (acc, t) => {
      acc[t.value] = marketplaceScoped.filter((p) => matchesStatusTab(p, t.value)).length;
      return acc;
    },
    {} as Record<ProductStatus, number>,
  );

  const q = search.trim().toLowerCase();
  const filtered = marketplaceScoped.filter((p) => {
    if (!matchesStatusTab(p, statusTab)) return false;
    if (
      q &&
      !p.namaProduk.toLowerCase().includes(q) &&
      !p.skuInduk.toLowerCase().includes(q)
    )
      return false;
    return true;
  });

  const allChecked = filtered.length > 0 && filtered.every((p) => selected.includes(p.id));
  const someChecked = filtered.some((p) => selected.includes(p.id)) && !allChecked;

  const toggleAll = () => {
    if (allChecked) {
      setSelected((s) => s.filter((id) => !filtered.some((p) => p.id === id)));
    } else {
      setSelected((s) => Array.from(new Set([...s, ...filtered.map((p) => p.id)])));
    }
  };

  const toggleOne = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  return (
    <TooltipProvider delayDuration={150}>
      <div className="space-y-6">
        <PageHeader
          title={title}
          description={description}
          actions={
            <>
              <Button variant="outline" size="sm" className="hidden sm:inline-flex">
                Import
              </Button>
              <Button variant="outline" size="sm" className="hidden sm:inline-flex">
                Export
              </Button>
              <Button size="sm">
                <RefreshCw className="h-4 w-4" />
                Sinkron dari Marketplace
              </Button>
            </>
          }
        />

        {/* Marketplace tabs */}
        <Card className="p-4 space-y-4">
          <div className="flex items-center gap-6 border-b -mx-4 px-4 pb-0">
            <span className="text-sm text-muted-foreground pb-3">Marketplace</span>
            <div className="flex items-center gap-1">
              {marketplaceTabs.map((m) => (
                <button
                  key={m}
                  onClick={() => setMarketplace(m)}
                  className={cn(
                    "px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
                    marketplace === m
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground",
                  )}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Search row */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-muted-foreground shrink-0">Pencarian</span>
            <Select defaultValue="Nama Produk">
              <SelectTrigger className="h-9 w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Nama Produk">Nama Produk</SelectItem>
                <SelectItem value="SKU Induk">SKU Induk</SelectItem>
                <SelectItem value="SKU">SKU</SelectItem>
              </SelectContent>
            </Select>
            <div className="relative flex-1 min-w-[200px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Pencarian"
                className="h-9 pl-9"
              />
            </div>
            <Select defaultValue="Pencarian Sama Dengan">
              <SelectTrigger className="h-9 w-[220px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Pencarian Sama Dengan">Pencarian Sama Dengan</SelectItem>
                <SelectItem value="Mengandung">Mengandung</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Bulk actions bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {(statusFilter === "archive" || statusFilter === "draft") && (
              <Button
                className="bg-emerald-600 text-white hover:bg-emerald-700"
                disabled={selected.length === 0}
                onClick={() => setActivateDialogOpen(true)}
              >
                Aktifkan Produk
              </Button>
            )}

          </div>
          <div className="flex flex-wrap items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  Impor &amp; Ekspor
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>Impor Produk</DropdownMenuItem>
                <DropdownMenuItem>Ekspor Produk</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  Sinkronisasi Produk
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>Sinkron dari Marketplace</DropdownMenuItem>
                <DropdownMenuItem>Sinkron ke Marketplace</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button asChild>
              <Link to="/produk/tambah">
                <Plus className="h-4 w-4" />
                Tambah Produk
              </Link>
            </Button>
          </div>
        </div>

        {/* Status tabs + table */}
        <Card className="overflow-hidden">
          <Tabs value={statusTab} onValueChange={(v) => setStatusTab(v as ProductStatus)}>
            <div className="border-b px-2 sm:px-4">
              <TabsList className="h-auto w-full justify-start gap-1 rounded-none bg-transparent p-0">
                {PRODUCT_STATUS_TABS.map((t) => (
                  <TabsTrigger
                    key={t.value}
                    value={t.value}
                    className="relative rounded-none border-b-2 border-transparent bg-transparent px-3 py-3 text-sm font-medium text-muted-foreground shadow-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
                  >
                    {t.label} ({statusCounts[t.value]})
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="w-10">
                      <Checkbox
                        checked={allChecked ? true : someChecked ? "indeterminate" : false}
                        onCheckedChange={toggleAll}
                      />
                    </TableHead>
                    <TableHead className="min-w-[320px]">Produk &amp; Toko</TableHead>
                    <TableHead>SKU Induk</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead className="text-right">HPP</TableHead>
                    <TableHead className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        Harga Jual{" "}
                        <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                    </TableHead>
                    <TableHead className="text-right">Stok</TableHead>
                    <TableHead>Waktu</TableHead>
                    <TableHead className="w-24 text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={9}
                        className="py-14 text-center text-sm text-muted-foreground"
                      >
                        Tidak ada produk yang cocok dengan filter.
                      </TableCell>
                    </TableRow>
                  )}
                  {filtered.map((p) => (
                    <ProductRow
                      key={p.id}
                      product={p}
                      checked={selected.includes(p.id)}
                      onToggle={() => toggleOne(p.id)}
                      onCopy={() => setCopySourceId(p.id)}
                      onDelete={() => setDeleteTargetId(p.id)}
                      onArchive={() => setArchiveTargetId(p.id)}
                      onEditPrice={() => setEditPriceId(p.id)}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex flex-col gap-2 border-t px-4 py-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
              <span>
                Menampilkan{" "}
                <span className="font-medium text-foreground">1 - {filtered.length}</span> dari{" "}
                <span className="font-medium text-foreground">{filtered.length}</span> produk
              </span>
              <div className="flex items-center gap-2">
                <Select defaultValue="20">
                  <SelectTrigger className="h-8 w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="20">20 / halaman</SelectItem>
                    <SelectItem value="50">50 / halaman</SelectItem>
                    <SelectItem value="100">100 / halaman</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" disabled>
                  &lt;
                </Button>
                <Button variant="outline" size="sm" className="bg-primary text-primary-foreground">
                  1
                </Button>
                <Button variant="outline" size="sm">2</Button>
                <Button variant="outline" size="sm">3</Button>
                <Button variant="outline" size="sm">4</Button>
                <Button variant="outline" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm">&gt;</Button>
              </div>
            </div>
          </Tabs>
        </Card>

        <CopyProductDialog
          open={copySourceId !== null}
          onOpenChange={(o) => !o && setCopySourceId(null)}
          sourceShopName={
            copySourceId ? all.find((p) => p.id === copySourceId)?.marketplace : undefined
          }
          onConfirm={(shop) => {
            if (!copySourceId) return;
            const created = duplicateProduct(copySourceId, shop.shopName);
            setCopySourceId(null);
            if (created) {
              toast.success(`Produk disalin ke ${shop.shopName}`);
              navigate({ to: "/produk/draft" });
            } else {
              toast.error("Gagal menyalin produk.");
            }
          }}
        />

        <EditPriceDialog
          open={editPriceId !== null}
          onOpenChange={(o) => !o && setEditPriceId(null)}
          product={editPriceId ? all.find((p) => p.id === editPriceId) ?? null : null}
        />

        <AlertDialog
          open={deleteTargetId !== null}
          onOpenChange={(o) => !o && setDeleteTargetId(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Hapus Produk</AlertDialogTitle>
              <AlertDialogDescription>
                Apakah Anda yakin ingin menghapus produk ini? Produk tidak akan dihapus
                permanen. Produk akan dipindahkan ke menu Arsip dan masih dapat dipulihkan.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (!deleteTargetId) return;
                  productStore.archiveProduct(deleteTargetId);
                  setDeleteTargetId(null);
                  toast.success("Produk dipindahkan ke Arsip");
                }}
              >
                Hapus Produk
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog
          open={archiveTargetId !== null}
          onOpenChange={(o) => !o && setArchiveTargetId(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Arsipkan Produk</AlertDialogTitle>
              <AlertDialogDescription>
                Produk akan dipindahkan ke Arsip Produk. Produk tidak akan tampil lagi
                pada menu Live, namun masih dapat dipulihkan kapan saja.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (!archiveTargetId) return;
                  productStore.archiveProduct(archiveTargetId);
                  setArchiveTargetId(null);
                  toast.success("Produk dipindahkan ke Arsip");
                }}
              >
                Arsipkan
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={activateDialogOpen} onOpenChange={setActivateDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Aktifkan Produk</AlertDialogTitle>
              <AlertDialogDescription>
                {statusFilter === "draft"
                  ? "Produk yang dipilih akan dipublikasikan ke Produk Live dan siap disinkronkan ke marketplace."
                  : "Produk yang dipilih akan dipindahkan kembali ke Produk Live dan dapat dijual kembali."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  const ids = [...selected];
                  const now = Date.now();
                  ids.forEach((id) => {
                    productStore.updateProduct(id, {
                      status: "live",
                      updatedAt: now,
                    });
                  });
                  setSelected((s) => s.filter((id) => !ids.includes(id)));
                  setActivateDialogOpen(false);
                  toast.success(
                    ids.length > 1
                      ? `${ids.length} produk diaktifkan`
                      : "Produk diaktifkan",
                  );
                }}
              >
                Aktifkan
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
}

function ProductRow({
  product,
  checked,
  onToggle,
  onCopy,
  onDelete,
  onArchive,
  onEditPrice,
}: {
  product: StoredProduct;
  checked: boolean;
  onToggle: () => void;
  onCopy: () => void;
  onDelete: () => void;
  onArchive: () => void;
  onEditPrice: () => void;
}) {
  const sales = salesFor(product.skuInduk || product.id);
  const favs = favFor(product.skuInduk || product.id);
  const views = viewsFor(product.skuInduk || product.id);
  const variations: StoredVariant[] =
    product.variants && product.variants.length > 0
      ? product.variants.slice(0, 3)
      : [
          {
            sku: product.skuInduk || "",
            harga: product.harga,
            stok: product.stok,
            gambar: product.fotoCover,
            status: true,
          },
        ];
  const rowCount = variations.length;
  const created = fmtDate(product.createdAt);
  const updated = fmtDate(product.updatedAt);

  return (
    <>
      {variations.map((v, i) => (
        <TableRow
          key={`${product.id}-${i}`}
          data-state={checked ? "selected" : undefined}
          className={cn(i === 0 ? "border-t-2" : "border-t border-dashed")}
        >
          {i === 0 && (
            <>
              <TableCell rowSpan={rowCount} className="align-top">
                <Checkbox checked={checked} onCheckedChange={onToggle} />
              </TableCell>
              <TableCell rowSpan={rowCount} className="align-top">
                <div className="flex gap-3">
                  {product.fotoCover ? (
                    <img
                      src={product.fotoCover}
                      alt={product.namaProduk}
                      className="h-14 w-14 shrink-0 rounded-md border object-cover"
                    />
                  ) : (
                    <div className="h-14 w-14 shrink-0 rounded-md border bg-muted" />
                  )}
                  <div className="min-w-0 space-y-1">
                    <p className="text-sm font-medium text-foreground line-clamp-2">
                      {product.namaProduk || "(Tanpa nama)"}
                    </p>
                    <p className="text-xs text-muted-foreground">Item ID: {product.id}</p>
                    <p className="text-xs text-muted-foreground">
                      Penjualan: <span className="text-foreground">{sales}</span>
                      <span className="mx-2">
                        Favorit: <span className="text-foreground">{favs}</span>
                      </span>
                      Produk Terlihat: <span className="text-foreground">{views}</span>
                    </p>
                    <span className="inline-block rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      {product.marketplace || "Maqil_FashionStore"}
                    </span>
                  </div>
                </div>
              </TableCell>
              <TableCell rowSpan={rowCount} className="align-top text-sm">
                {(product.skuInduk || "-").toLowerCase()}
              </TableCell>
            </>
          )}
          <TableCell className="align-top">
            <div className="text-sm text-muted-foreground">{v.sku || "--"}</div>
            <div className="text-xs text-muted-foreground">SKU ID: {v.sku || "-"}</div>
          </TableCell>
          {i === 0 && (
            <>
              <TableCell rowSpan={rowCount} className="align-top text-right">
                <InlinePriceCell
                  value={product.hpp}
                  label="HPP"
                  emptyText="Belum Diisi"
                  allowEmpty
                  onSave={(next) =>
                    productStore.updateProduct(product.id, {
                      hpp: next ?? undefined,
                    })
                  }
                />
              </TableCell>
              <TableCell rowSpan={rowCount} className="align-top text-right">
                <InlinePriceCell
                  value={product.sellingPrice ?? product.harga}
                  label="Harga Jual"
                  onSave={(next) => {
                    if (next == null) return;
                    const nextVariants =
                      product.variants && product.variants.length > 0
                        ? product.variants.map((vv) => ({ ...vv, harga: next }))
                        : product.variants;
                    productStore.updateProduct(product.id, {
                      sellingPrice: next,
                      harga: next,
                      variants: nextVariants,
                    });
                  }}
                />
              </TableCell>
            </>
          )}
          <TableCell className="align-top text-right text-sm tabular-nums">
            {v.stok}
          </TableCell>
          {i === 0 && (
            <>
              <TableCell rowSpan={rowCount} className="align-top">
                <div className="space-y-1 text-xs text-muted-foreground">
                  <div>
                    <div>Waktu Dibuat</div>
                    <div className="text-foreground">{created}</div>
                  </div>
                  <div>
                    <div>Waktu Dibuat (Marketplace)</div>
                    <div className="text-foreground">{created}</div>
                  </div>
                  <div>
                    <div>Waktu Diperbarui</div>
                    <div className="text-foreground">{updated}</div>
                  </div>
                </div>
              </TableCell>
              <TableCell rowSpan={rowCount} className="align-top">
                <div className="flex flex-col items-end gap-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                        <Link to="/produk/tambah" search={{ id: product.id }}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Edit</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={onEditPrice}
                      >
                        <Wallet className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Edit Harga</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Sinkron</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onCopy}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Salin</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={onDelete}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Hapus Produk</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={onArchive}
                      >
                        <Archive className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Arsipkan Produk</TooltipContent>
                  </Tooltip>
                </div>
              </TableCell>
            </>
          )}
        </TableRow>
      ))}
    </>
  );
}
