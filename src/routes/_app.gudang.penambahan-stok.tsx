import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Search, Trash2, PackagePlus } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/page-header";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  useProductsByStatus,
  productStore,
  type StoredProduct,
  type StoredVariant,
} from "@/lib/product-store";
import {
  stockHistoryStore,
  type StockHistoryInput,
} from "@/lib/stock-history-store";


export const Route = createFileRoute("/_app/gudang/penambahan-stok")({
  head: () => ({
    meta: [
      { title: "Penambahan Stok — MAQIL.ERP" },
      {
        name: "description",
        content:
          "Tambah stok SKU ERP langsung dari Master Produk secara realtime.",
      },
    ],
  }),
  component: PenambahanStokPage,
});

type SkuRow = {
  key: string;
  productId: string;
  variantIndex: number | null; // null = produk tanpa variasi
  imageUrl: string | null;
  namaProduk: string;
  sku: string;
  variasi: string;
  stokSaatIni: number;
};

type SelectedEntry = {
  row: SkuRow;
  jumlah: string;
  keterangan: string;
};

function variantLabel(v: StoredVariant, i: number): string {
  const anyV = v as StoredVariant & { nama?: string; name?: string };
  return anyV.nama || anyV.name || v.sku || `Variasi ${i + 1}`;
}

function flatten(products: StoredProduct[]): SkuRow[] {
  const rows: SkuRow[] = [];
  for (const p of products) {
    if (p.variants && p.variants.length > 0) {
      p.variants.forEach((v, i) => {
        rows.push({
          key: `${p.id}::${i}`,
          productId: p.id,
          variantIndex: i,
          imageUrl: v.gambar || p.fotoCover || null,
          namaProduk: p.namaProduk || "(Tanpa nama)",
          sku: v.sku || p.skuInduk || "-",
          variasi: variantLabel(v, i),
          stokSaatIni: v.stok ?? 0,
        });
      });
    } else {
      rows.push({
        key: `${p.id}::_`,
        productId: p.id,
        variantIndex: null,
        imageUrl: p.fotoCover,
        namaProduk: p.namaProduk || "(Tanpa nama)",
        sku: p.skuInduk || "-",
        variasi: "-",
        stokSaatIni: p.stok ?? 0,
      });
    }
  }
  return rows;
}

function PenambahanStokPage() {
  const liveProducts = useProductsByStatus("live");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Record<string, SelectedEntry>>({});

  const allRows = useMemo(() => flatten(liveProducts), [liveProducts]);

  const visibleRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allRows.filter((r) => {
      if (selected[r.key]) return false;
      if (!q) return true;
      return (
        r.namaProduk.toLowerCase().includes(q) ||
        r.sku.toLowerCase().includes(q) ||
        r.variasi.toLowerCase().includes(q)
      );
    });
  }, [allRows, search, selected]);

  const toggle = (row: SkuRow, checked: boolean) => {
    setSelected((prev) => {
      const next = { ...prev };
      if (checked) {
        next[row.key] = { row, jumlah: "", keterangan: "" };
      } else {
        delete next[row.key];
      }
      return next;
    });
  };

  const updateEntry = (key: string, patch: Partial<SelectedEntry>) => {
    setSelected((prev) =>
      prev[key] ? { ...prev, [key]: { ...prev[key], ...patch } } : prev,
    );
  };

  const remove = (key: string) => {
    setSelected((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const reset = () => setSelected({});

  const selectedList = Object.values(selected);

  const handleSave = () => {
    if (selectedList.length === 0) {
      toast.error("Pilih minimal 1 SKU terlebih dahulu.");
      return;
    }
    const invalid = selectedList.find(
      (e) => !e.jumlah || Number(e.jumlah) <= 0 || !Number.isFinite(Number(e.jumlah)),
    );
    if (invalid) {
      toast.error(`Isi jumlah penambahan valid untuk SKU ${invalid.row.sku}.`);
      return;
    }

    // Kelompokkan per produk agar update variants sekali per produk.
    const byProduct = new Map<string, SelectedEntry[]>();
    for (const e of selectedList) {
      const list = byProduct.get(e.row.productId) ?? [];
      list.push(e);
      byProduct.set(e.row.productId, list);
    }

    let totalTambah = 0;
    const historyEntries: StockHistoryInput[] = [];
    for (const [productId, entries] of byProduct) {
      const p = productStore.getById(productId);
      if (!p) continue;
      if (p.variants && p.variants.length > 0) {
        const nextVariants = p.variants.map((v, i) => {
          const entry = entries.find((e) => e.row.variantIndex === i);
          if (!entry) return v;
          const add = Number(entry.jumlah) || 0;
          const before = v.stok ?? 0;
          const after = before + add;
          totalTambah += add;
          historyEntries.push({
            transactionType: "ADD_STOCK",
            referenceNo: "",
            productId,
            variantIndex: i,
            sku: entry.row.sku,
            productName: entry.row.namaProduk,
            variation: entry.row.variasi,
            warehouse: "Gudang Utama",
            beforeStock: before,
            changeQty: add,
            afterStock: after,
            note: entry.keterangan.trim() || undefined,
          });
          return { ...v, stok: after };
        });
        const nextTotal = nextVariants.reduce((s, v) => s + (v.stok ?? 0), 0);
        productStore.updateProduct(productId, {
          variants: nextVariants,
          stok: nextTotal,
        });
      } else {
        const entry = entries[0];
        const add = Number(entry.jumlah) || 0;
        const before = p.stok ?? 0;
        const after = before + add;
        totalTambah += add;
        historyEntries.push({
          transactionType: "ADD_STOCK",
          referenceNo: "",
          productId,
          variantIndex: null,
          sku: entry.row.sku,
          productName: entry.row.namaProduk,
          variation: entry.row.variasi,
          warehouse: "Gudang Utama",
          beforeStock: before,
          changeQty: add,
          afterStock: after,
          note: entry.keterangan.trim() || undefined,
        });
        productStore.updateProduct(productId, { stok: after });
      }
    }

    if (historyEntries.length > 0) {
      stockHistoryStore.record(historyEntries);
    }


    toast.success(
      `Berhasil menambah ${totalTambah} stok untuk ${selectedList.length} SKU.`,
    );
    reset();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Penambahan Stok"
        description="Pilih SKU ERP dari Master Produk lalu tambahkan jumlah stok masuk. Perubahan langsung sinkron ke seluruh ERP."
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(360px,460px)]">
        {/* Panel kiri: pencarian SKU */}
        <Card className="flex h-[calc(100vh-220px)] min-h-[520px] flex-col overflow-hidden">
          <div className="border-b p-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama produk, SKU ERP, atau variasi..."
                className="h-10 pl-9"
              />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Menampilkan {visibleRows.length} SKU dari Master Produk (Live).
            </p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {visibleRows.length === 0 ? (
              <div className="p-10 text-center text-sm text-muted-foreground">
                {allRows.length === 0
                  ? "Belum ada produk Live pada Master Produk."
                  : "Tidak ada SKU yang cocok dengan pencarian."}
              </div>
            ) : (
              <ul className="divide-y">
                {visibleRows.map((r) => (
                  <li
                    key={r.key}
                    className="flex items-center gap-3 p-3 hover:bg-muted/40"
                  >
                    <Checkbox
                      checked={false}
                      onCheckedChange={(c) => toggle(r, c === true)}
                      aria-label={`Pilih ${r.sku}`}
                    />
                    {r.imageUrl ? (
                      <img
                        src={r.imageUrl}
                        alt={r.namaProduk}
                        className="h-12 w-12 rounded-md border object-cover"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-md border bg-muted" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-foreground">
                        {r.namaProduk}
                      </div>
                      <div className="mt-0.5 font-mono text-xs text-muted-foreground">
                        {r.sku}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Variasi: {r.variasi}
                      </div>
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      <div>Stok</div>
                      <div className="tabular-nums text-sm font-medium text-foreground">
                        {r.stokSaatIni}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>

        {/* Panel kanan: daftar SKU terpilih */}
        <Card className="flex h-[calc(100vh-220px)] min-h-[520px] flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b p-4">
            <div>
              <div className="text-sm font-semibold">SKU yang Akan Ditambah Stok</div>
              <div className="text-xs text-muted-foreground">
                {selectedList.length} SKU dipilih
              </div>
            </div>
            {selectedList.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={reset}
                className="text-muted-foreground"
              >
                Kosongkan
              </Button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            {selectedList.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-2 p-10 text-center text-sm text-muted-foreground">
                <PackagePlus className="h-8 w-8 opacity-40" />
                <div>Belum ada SKU dipilih.</div>
                <div className="text-xs">
                  Centang SKU di panel kiri untuk mulai menambah stok.
                </div>
              </div>
            ) : (
              <ul className="divide-y">
                {selectedList.map((e) => (
                  <li key={e.row.key} className="space-y-3 p-4">
                    <div className="flex items-start gap-3">
                      {e.row.imageUrl ? (
                        <img
                          src={e.row.imageUrl}
                          alt={e.row.namaProduk}
                          className="h-12 w-12 rounded-md border object-cover"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-md border bg-muted" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">
                          {e.row.namaProduk}
                        </div>
                        <div className="font-mono text-xs text-muted-foreground">
                          {e.row.sku}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Variasi: {e.row.variasi} · Stok saat ini:{" "}
                          <span className="tabular-nums font-medium text-foreground">
                            {e.row.stokSaatIni}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => remove(e.row.key)}
                        aria-label="Hapus"
                        className="text-red-500 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Jumlah Penambahan</Label>
                        <Input
                          type="number"
                          min={1}
                          inputMode="numeric"
                          value={e.jumlah}
                          onChange={(ev) =>
                            updateEntry(e.row.key, { jumlah: ev.target.value })
                          }
                          placeholder="0"
                          className="h-9"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Keterangan (opsional)</Label>
                        <Textarea
                          value={e.keterangan}
                          onChange={(ev) =>
                            updateEntry(e.row.key, { keterangan: ev.target.value })
                          }
                          placeholder="Catatan..."
                          rows={1}
                          className="min-h-9 resize-none"
                        />
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 border-t bg-muted/20 p-3">
            <Button variant="outline" onClick={reset} disabled={selectedList.length === 0}>
              Batal
            </Button>
            <Button onClick={handleSave} disabled={selectedList.length === 0}>
              Simpan Penambahan Stok
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
