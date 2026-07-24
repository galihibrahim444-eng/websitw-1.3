import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Sparkles, HelpCircle, ChevronDown } from "lucide-react";
import { ProductPhotoGrid } from "@/components/produk/product-photo-grid";
import { ProductVideoUpload } from "@/components/produk/product-video-upload";
import { emptyProductMedia, type ProductMedia } from "@/lib/product-media";
import {
  emptyProductInformation,
  PRODUCT_DESCRIPTION_MAX_LENGTH,
  PRODUCT_NAME_MAX_LENGTH,
  type ProductInformation,
} from "@/lib/product-information";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useMarketplaceShops } from "@/hooks/use-marketplace-shops";
import type { MarketplaceAccount } from "@/services/marketplaceAccountService";
import { useCategoryOptions } from "@/hooks/use-categories";
import { useBrands } from "@/hooks/use-brands";
import { ProductVariationFields } from "@/components/produk/product-variation-fields";
import { VariantSkuTable } from "@/components/produk/variant-sku-table";
import type { ProductVariant } from "@/lib/variant-sku";
import {
  type ProductVariationOption,
} from "@/lib/product-variations";
import { validatePublishPayload } from "@/lib/product-save-validation";
import {
  productService,
  SAVE_ACTION_STATUS,
  type ProductSaveAction,
  type ProductSavePayload,
} from "@/services/product";
import { toast } from "sonner";
import { productStore } from "@/lib/product-store";
import { payloadToStoredProduct } from "@/lib/product-store-mapper";

type TambahSearch = { id?: string };

export const Route = createFileRoute("/_app/produk/tambah")({
  head: () => ({ meta: [{ title: "Tambah Produk — MAQIL.ERP" }] }),
  validateSearch: (s: Record<string, unknown>): TambahSearch => ({
    id: typeof s.id === "string" ? s.id : undefined,
  }),
  component: TambahProdukPage,
});

const sections = [
  { id: "informasi-dasar", label: "Informasi Dasar" },
  { id: "media", label: "Media" },
  { id: "informasi-produk", label: "Informasi Produk" },
  { id: "informasi-penjualan", label: "Informasi Penjualan" },
  { id: "pengiriman", label: "Pengiriman" },
  { id: "lainnya", label: "Lainnya" },
] as const;

function TambahProdukPage() {
  // Single Source of Truth untuk Informasi Dasar & Informasi Produk.
  // Bentuk sudah cocok untuk dikirim ke Shopee Open API tanpa
  // transformasi lanjutan.
  const [productInformation, setProductInformation] =
    useState<ProductInformation>(() => emptyProductInformation());
  const {
    productName,
    categoryId,
    categoryPath,
    brandId,
    description: deskripsi,
  } = productInformation;
  const updateProductInformation = <K extends keyof ProductInformation>(
    key: K,
    value: ProductInformation[K],
  ) => setProductInformation((prev) => ({ ...prev, [key]: value }));

  const [variasi, setVariasi] = useState<"tunggal" | "berbagai">("tunggal");
  const [variations, setVariations] = useState<ProductVariationOption[]>([]);
  const [variants, setVariants] = useState<Record<string, ProductVariant>>({});
  const [parentSku, setParentSku] = useState("");
  /** Berat produk dalam GRAM (integer). Source of truth untuk Shopee Open API. */
  const [weightGram, setWeightGram] = useState("");
  const [hpp, setHpp] = useState("");
  const [singlePrice, setSinglePrice] = useState("");
  const [singleStock, setSingleStock] = useState("");
  const [preOrder, setPreOrder] = useState<"tidak" | "ya">("tidak");
  const [kondisi, setKondisi] = useState<"baru" | "pernah">("baru");
  const [sumbers, setSumbers] = useState<{ pemasok: string; produk: string }[]>([
    { pemasok: "", produk: "" },
  ]);
  const [active, setActive] = useState<string>(sections[0].id);
  const [saving, setSaving] = useState(false);
  // State media tunggal (images + video) — bentuk sudah cocok untuk dikirim
  // ke Shopee Open API tanpa transformasi lanjutan.
  const [media, setMedia] = useState<ProductMedia>(() => emptyProductMedia());

  // Toko dropdown state — data berasal dari MarketplaceAccountService
  // (dummy sekarang, siap diganti dengan Shopee Open API di masa depan).
  const { shops, loading: shopsLoading } = useMarketplaceShops("Shopee");
  const { options: categoryOptions, loading: categoriesLoading } =
    useCategoryOptions();
  const { brands, loading: brandsLoading } = useBrands(categoryPath);
  const [selectedShop, setSelectedShop] = useState<MarketplaceAccount | null>(
    null,
  );

  const navigate = useNavigate();
  const { id: editingId } = Route.useSearch();
  const isEditMode = Boolean(editingId);

  useEffect(() => {
    if (!editingId) return;
    const existing = productStore.getById(editingId);
    if (!existing) return;
    const raw = existing.raw;
    if (raw) {
      setProductInformation(raw.productInformation);
      setMedia(raw.media);
      setParentSku(raw.parentSku ?? "");
      setWeightGram(raw.weightGram ? String(raw.weightGram) : "");
      setVariasi(raw.variasi);
      setSinglePrice(raw.singlePrice ?? "");
      setSingleStock(raw.singleStock ?? "");
      setHpp(raw.hpp ?? "");
      setVariations(raw.variations ?? []);
      setVariants(raw.variants ?? {});
      setPreOrder(raw.preOrder);
      setKondisi(raw.kondisi);
      setSumbers(raw.sumbers?.length ? raw.sumbers : [{ pemasok: "", produk: "" }]);
      setSelectedShop({
        shopId: raw.shopId,
        merchantId: raw.merchantId,
        marketplace: raw.marketplace,
        shopName: String(raw.shopId),
        status: "Connected",
      } as MarketplaceAccount);
    } else {
      // Fallback: produk lama tanpa snapshot `raw` — rehidrasi seminimal
      // mungkin dari field StoredProduct agar form tidak kosong total.
      setProductInformation((prev) => ({
        ...prev,
        productName: existing.namaProduk,
      }));
      setParentSku(existing.skuInduk ?? "");
      setSinglePrice(existing.harga ? String(existing.harga) : "");
      setSingleStock(existing.stok ? String(existing.stok) : "");
      setHpp(existing.hpp ? String(existing.hpp) : "");
    }
  }, [editingId]);


  // Auto-select jika hanya ada satu toko yang terhubung.
  useEffect(() => {
    if (!selectedShop && shops.length === 1) {
      setSelectedShop(shops[0]);
    }
  }, [shops, selectedShop]);

  const handleSelectShop = (shopIdValue: string) => {
    const shop = shops.find((s) => String(s.shopId) === shopIdValue) ?? null;
    setSelectedShop(shop);
  };

  const saveProduct = async (action: ProductSaveAction) => {
    if (saving) return;
    if (!selectedShop) {
      toast.warning("Pilih toko terlebih dahulu.");
      return;
    }

    const payload: ProductSavePayload = {
      shopId: selectedShop.shopId,
      merchantId: selectedShop.merchantId,
      marketplace: selectedShop.marketplace,
      status: SAVE_ACTION_STATUS[action],
      productInformation,
      media,
      parentSku,
      weightGram: Number(weightGram) || 0,
      variasi,
      hpp,
      singlePrice,
      singleStock,
      variations: variasi === "berbagai" ? variations : [],
      variants: variasi === "berbagai" ? variants : {},
      preOrder,
      kondisi,
      sumbers,
    };

    // Draft: validasi minimal (hanya nama produk supaya baris kosong tidak
    // tersimpan). Publish/Archive: validasi penuh.
    if (action === "draft") {
      if (!productInformation.productName.trim()) {
        toast.error("Form belum lengkap", {
          description: "Nama Produk wajib diisi.",
        });
        return;
      }
    } else {
      const errors = validatePublishPayload(payload, brands);
      if (errors.length) {
        toast.error("Form belum lengkap", { description: errors[0].message });
        return;
      }
    }

    setSaving(true);
    try {
      if (isEditMode && editingId) {
        // Mode Edit: perbarui produk yang sudah ada di store — jangan buat id baru.
        const existing = productStore.getById(editingId);
        const stored = payloadToStoredProduct(payload, {
          id: editingId,
          createdAt: existing?.createdAt ?? Date.now(),
        });
        productStore.updateProduct(editingId, stored);
      } else {
        await productService.saveProduct(payload, action);
      }
      if (action === "draft") {
        toast.success(
          isEditMode ? "Produk berhasil diperbarui (Draft)." : "Produk berhasil disimpan sebagai Draft.",
        );
        navigate({ to: "/produk/draft" });
      } else if (action === "publish") {
        toast.success(isEditMode ? "Produk berhasil diperbarui." : "Produk berhasil dipublikasikan.");
        navigate({ to: "/produk" });
      } else {
        toast.success(
          isEditMode ? "Produk diperbarui & dipindahkan ke Arsip." : "Produk berhasil dipindahkan ke Arsip.",
        );
        navigate({ to: "/produk/arsip" });
      }
    } catch (err) {
      toast.error("Gagal menyimpan produk", {
        description: err instanceof Error ? err.message : "Terjadi kesalahan.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="-m-4 sm:-m-6">
      {/* Sticky top header */}
      <div className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 border-b bg-background px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/produk">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-base font-semibold text-foreground">
            Shopee &gt; {isEditMode ? "Edit Produk" : "Tambah Produk"}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={saving}
            onClick={() => saveProduct("draft")}
          >
            Simpan ke draf
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                disabled={saving}
                className="bg-violet-600 text-white hover:bg-violet-700"
              >
                Simpan &amp; Tampilkan
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => saveProduct("publish")}>
                Simpan &amp; Tampilkan
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => saveProduct("archive")}>
                Simpan &amp; Arsipkan
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex gap-6 bg-muted/30 p-4 sm:p-6">
        {/* Main form */}
        <div className="min-w-0 flex-1 space-y-4">
          {/* Informasi Dasar */}
          <Section id="informasi-dasar" title="Informasi Dasar" onEnter={setActive}>
            <FieldRow label="Toko" required>
              {shopsLoading ? (
                <div className="max-w-md text-sm text-muted-foreground">
                  Memuat daftar toko…
                </div>
              ) : shops.length === 0 ? (
                <div className="flex max-w-md flex-col items-start gap-2">
                  <p className="text-sm text-muted-foreground">
                    Belum ada toko Shopee yang terhubung.
                  </p>
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/marketplace">Hubungkan Marketplace</Link>
                  </Button>
                </div>
              ) : (
                <Select
                  value={selectedShop ? String(selectedShop.shopId) : undefined}
                  onValueChange={handleSelectShop}
                >
                  <SelectTrigger className="max-w-md">
                    <SelectValue placeholder="-- Pilihan --" />
                  </SelectTrigger>
                  <SelectContent>
                    {shops.map((shop) => (
                      <SelectItem key={shop.shopId} value={String(shop.shopId)}>
                        {shop.shopName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </FieldRow>
            <FieldRow label="Nama Produk" required>
              <div className="relative">
                <Input
                  value={productName}
                  onChange={(e) =>
                    updateProductInformation(
                      "productName",
                      e.target.value.slice(0, PRODUCT_NAME_MAX_LENGTH),
                    )
                  }
                  placeholder=""
                />
                <div className="absolute inset-y-0 right-2 flex items-center gap-2 text-xs text-muted-foreground">
                  <button type="button" className="rounded p-1 hover:bg-muted">
                    <Sparkles className="h-3.5 w-3.5 text-violet-600" />
                  </button>
                  <span>{productName.length} / {PRODUCT_NAME_MAX_LENGTH}</span>
                </div>
              </div>
            </FieldRow>
            <FieldRow label="Kategori" required>
              <div className="flex items-center gap-3">
                <Select
                  value={categoryId != null ? String(categoryId) : undefined}
                  onValueChange={(value) => {
                    const picked = categoryOptions.find(
                      (o) => String(o.id) === value,
                    );
                    setProductInformation((prev) => ({
                      ...prev,
                      categoryId: picked ? picked.id : value,
                      categoryPath: picked
                        ? picked.path.map((p) => ({ id: p.id, name: p.name }))
                        : [],
                      // reset brand ketika kategori berubah
                      brandId: null,
                      // reset atribut ketika kategori berubah
                      attributes: [],
                    }));
                  }}
                  disabled={categoriesLoading}
                >
                  <SelectTrigger className="max-w-md">
                    <SelectValue
                      placeholder={
                        categoriesLoading ? "Memuat kategori..." : "-- Pilihan --"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map((opt) => (
                      <SelectItem key={opt.id} value={String(opt.id)}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <button type="button" className="text-sm font-medium text-violet-600 hover:underline">
                  Memilih Kategori
                </button>
              </div>
            </FieldRow>
            <FieldRow label="Brand">
              <Select
                value={brandId != null ? String(brandId) : undefined}
                onValueChange={(value) =>
                  updateProductInformation("brandId", Number(value))
                }
                disabled={!categoryPath.length || brandsLoading}
              >
                <SelectTrigger className="max-w-md">
                  <SelectValue
                    placeholder={
                      !categoryPath.length
                        ? "Pilih kategori terlebih dahulu"
                        : brandsLoading
                          ? "Memuat brand..."
                          : "-- Pilih Brand --"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {brands.map((b) => (
                    <SelectItem key={b.brand_id} value={String(b.brand_id)}>
                      {b.display_brand_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldRow>


            {sumbers.map((s, i) => (
              <div key={i} className="space-y-3">
                <FieldRow label="Link Sumber Pemasok">
                  <div className="flex">
                    <Input
                      value={s.pemasok}
                      onChange={(e) => {
                        const next = [...sumbers];
                        next[i] = { ...next[i], pemasok: e.target.value };
                        setSumbers(next);
                      }}
                      className="rounded-r-none"
                    />
                    <Button variant="outline" className="rounded-l-none border-l-0">
                      Salin Tautan
                    </Button>
                  </div>
                </FieldRow>
                <FieldRow label="Link Sumber Produk">
                  <div className="flex">
                    <Input
                      value={s.produk}
                      onChange={(e) => {
                        const next = [...sumbers];
                        next[i] = { ...next[i], produk: e.target.value };
                        setSumbers(next);
                      }}
                      className="rounded-r-none"
                    />
                    <Button variant="outline" className="rounded-l-none border-l-0">
                      Salin Tautan
                    </Button>
                  </div>
                </FieldRow>
              </div>
            ))}
            <div className="pl-[160px]">
              <button
                type="button"
                onClick={() => setSumbers([...sumbers, { pemasok: "", produk: "" }])}
                className="text-sm font-medium text-violet-600 hover:underline"
              >
                + Tambahkan Sumber
              </button>
            </div>
          </Section>

          {/* Media */}
          <Section id="media" title="Media" onEnter={setActive}>
            <FieldRow label="Foto Produk" required>
              <ProductPhotoGrid
                photos={media.images}
                onChange={(images) => setMedia((m) => ({ ...m, images }))}
              />
            </FieldRow>
            <FieldRow label="Video">
              <ProductVideoUpload
                video={media.video}
                onChange={(video) => setMedia((m) => ({ ...m, video }))}
              />
            </FieldRow>
          </Section>

          {/* Informasi Produk */}
          <Section id="informasi-produk" title="Informasi Produk" onEnter={setActive}>
            <FieldRow label="SKU Induk">
              <div className="relative max-w-md">
                <Input
                  maxLength={100}
                  value={parentSku}
                  onChange={(e) => setParentSku(e.target.value)}
                />
                <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-xs text-muted-foreground">
                  {parentSku.length} / 100
                </span>
              </div>
            </FieldRow>
            {/* Blok Atribut dihapus: seluruh atribut variasi (Warna, Ukuran, dsb.)
                dikelola pada section "Informasi Penjualan → Variasi Produk". */}
            <FieldRow label={<span className="inline-flex items-center gap-1">Deskripsi Produk <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" /></span>} required>
              <div className="relative">
                <Textarea
                  value={deskripsi}
                  onChange={(e) =>
                    updateProductInformation(
                      "description",
                      e.target.value.slice(0, PRODUCT_DESCRIPTION_MAX_LENGTH),
                    )
                  }
                  rows={8}
                />
                <div className="absolute right-2 top-2">
                  <Button size="sm" variant="outline" className="text-violet-600 border-violet-200 bg-violet-50 hover:bg-violet-100 hover:text-violet-700">
                    <Sparkles className="h-3.5 w-3.5" />
                    Buat Teks
                  </Button>
                </div>
                <span className="pointer-events-none absolute bottom-2 right-3 text-xs text-muted-foreground">
                  {deskripsi.length} / {PRODUCT_DESCRIPTION_MAX_LENGTH}
                </span>
              </div>
            </FieldRow>
          </Section>

          {/* Informasi Penjualan */}
          <Section id="informasi-penjualan" title="Informasi Penjualan" onEnter={setActive}>
            <FieldRow label="Harga Modal (HPP)">
              <div className="flex items-center gap-3">
                <div className="relative max-w-xs">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    Rp
                  </span>
                  <Input
                    className="pl-9"
                    inputMode="numeric"
                    placeholder="0"
                    value={hpp}
                    onChange={(e) => setHpp(e.target.value.replace(/[^\d]/g, ""))}
                  />
                </div>
                <span className="text-xs text-muted-foreground">
                  Modal produk. Berlaku untuk seluruh variasi.
                </span>
              </div>
            </FieldRow>
            <FieldRow label="Variasi" required>
              <RadioGroup
                value={variasi}
                onValueChange={(v) => setVariasi(v as typeof variasi)}
                className="flex items-center gap-6"
              >
                <label className="flex items-center gap-2 text-sm">
                  <RadioGroupItem value="tunggal" /> Variasi Tunggal
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <RadioGroupItem value="berbagai" /> Berbagai Variasi
                </label>
              </RadioGroup>
            </FieldRow>
            {variasi === "tunggal" ? (
              <>
                <FieldRow label="Harga Jual" required>
                  <div className="flex items-center gap-3">
                    <Input
                      className="max-w-xs"
                      inputMode="numeric"
                      value={singlePrice}
                      onChange={(e) =>
                        setSinglePrice(e.target.value.replace(/[^\d]/g, ""))
                      }
                    />
                    <button type="button" className="text-sm font-medium text-violet-600 hover:underline">
                      Template Harga Asli
                    </button>
                  </div>
                </FieldRow>
                <FieldRow label="Stok" required>
                  <Input
                    className="max-w-xs"
                    inputMode="numeric"
                    value={singleStock}
                    onChange={(e) =>
                      setSingleStock(e.target.value.replace(/[^\d]/g, ""))
                    }
                  />
                </FieldRow>
                <FieldRow label="Grosir">
                  <button type="button" className="text-sm font-medium text-violet-600 hover:underline">
                    + Tambah Harga Grosir
                  </button>
                </FieldRow>
              </>
            ) : (
              <>
                <FieldRow label="Opsi Varian" required>
                  <ProductVariationFields
                    variations={variations}
                    onChange={setVariations}
                    media={media}
                    onMediaChange={setMedia}
                  />
                </FieldRow>
                <FieldRow label="Daftar Variasi">
                  <VariantSkuTable
                    variations={variations}
                    media={media}
                    variants={variants}
                    parentSku={parentSku}
                    onChange={setVariants}
                  />
                </FieldRow>
              </>
            )}
            <FieldRow label="Jumlah Pembelian Minimum" required>
              <Input defaultValue={1} className="max-w-xs" />
            </FieldRow>
            <FieldRow label={<span className="inline-flex items-center gap-1">Maksimal <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" /></span>}>
              <Input placeholder="Tidak Terbatas" className="max-w-xs" />
            </FieldRow>
          </Section>

          {/* Pengiriman */}
          <Section id="pengiriman" title="Pengiriman" onEnter={setActive}>
            <FieldRow label="Berat" required>
              <div className="relative max-w-xs">
                <Input
                  inputMode="numeric"
                  placeholder="500"
                  value={weightGram}
                  onChange={(e) =>
                    setWeightGram(e.target.value.replace(/[^\d]/g, ""))
                  }
                />
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground">
                  gram
                </span>
              </div>
            </FieldRow>
            <FieldRow label="Ukuran Paket">
              <div className="grid max-w-2xl grid-cols-3 gap-3">
                {["Lebar", "Panjang", "Tinggi"].map((k) => (
                  <div key={k} className="relative">
                    <Input placeholder={k} />
                    <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground">
                      cm
                    </span>
                  </div>
                ))}
              </div>
            </FieldRow>
          </Section>

          {/* Lainnya */}
          <Section id="lainnya" title="Lainnya" onEnter={setActive}>
            <FieldRow label="Pre-Order">
              <RadioGroup
                value={preOrder}
                onValueChange={(v) => setPreOrder(v as typeof preOrder)}
                className="flex items-center gap-6"
              >
                <label className="flex items-center gap-2 text-sm">
                  <RadioGroupItem value="tidak" /> Tidak
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <RadioGroupItem value="ya" /> Ya
                </label>
              </RadioGroup>
            </FieldRow>
            <FieldRow label="Kondisi">
              <RadioGroup
                value={kondisi}
                onValueChange={(v) => setKondisi(v as typeof kondisi)}
                className="flex items-center gap-6"
              >
                <label className="flex items-center gap-2 text-sm">
                  <RadioGroupItem value="baru" /> Baru
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <RadioGroupItem value="pernah" /> Pernah Dipakai
                </label>
              </RadioGroup>
            </FieldRow>
          </Section>
        </div>

        {/* Right anchor nav */}
        <aside className="sticky top-20 hidden h-fit w-48 shrink-0 lg:block">
          <ul className="space-y-3">
            {sections.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  onClick={() => setActive(s.id)}
                  className={cn(
                    "flex items-center gap-2 text-sm transition-colors",
                    active === s.id
                      ? "font-medium text-violet-600"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "inline-block h-2 w-2 rounded-full",
                      active === s.id ? "bg-violet-600" : "bg-muted-foreground/40",
                    )}
                  />
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}

function Section({
  id,
  title,
  children,
  onEnter,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
  onEnter: (id: string) => void;
}) {
  return (
    <Card
      id={id}
      onMouseEnter={() => onEnter(id)}
      className="scroll-mt-20 space-y-4 p-6"
    >
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      <div className="space-y-4">{children}</div>
    </Card>
  );
}

function FieldRow({
  label,
  required,
  children,
}: {
  label: React.ReactNode;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-[160px_minmax(0,1fr)] sm:items-start sm:gap-4">
      <Label className="pt-2 text-sm text-muted-foreground">
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </Label>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
