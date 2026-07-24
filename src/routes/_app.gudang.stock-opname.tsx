import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/page-header";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  useProductsByStatus,
  productStore,
  type StoredProduct,
  type StoredVariant,
} from "@/lib/product-store";
import { stockHistoryStore } from "@/lib/stock-history-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/gudang/stock-opname")({
  head: () => ({
    meta: [
      { title: "Stock Opname — MAQIL.ERP" },
      {
        name: "description",
        content:
          "Sesuaikan stok ERP dengan hasil hitung fisik gudang. Nilai akhir menggantikan stok yang tercatat.",
      },
    ],
  }),
  component: StockOpnamePage,
});

type SkuRow = {
  key: string;
  productId: string;
  variantIndex: number | null;
  imageUrl: string | null;
  namaProduk: string;
  sku: string;
  variasi: string;
  totalStok: number;
  dialokasikan: number;
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
          totalStok: v.stok ?? 0,
          dialokasikan: 0,
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
        totalStok: p.stok ?? 0,
        dialokasikan: 0,
      });
    }
  }
  return rows;
}

type EntryState = { hitung: string; catatan: string };

function StockOpnamePage() {
  const liveProducts = useProductsByStatus("live");
  const [search, setSearch] = useState("");
  const [entries, setEntries] = useState<Record<string, EntryState>>({});

  const allRows = useMemo(() => flatten(liveProducts), [liveProducts]);
  const visibleRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allRows;
    return allRows.filter(
      (r) =>
        r.namaProduk.toLowerCase().includes(q) ||
        r.sku.toLowerCase().includes(q) ||
        r.variasi.toLowerCase().includes(q),
    );
  }, [allRows, search]);

  const updateEntry = (key: string, patch: Partial<EntryState>) => {
    setEntries((prev) => {
      const prevEntry = prev[key] ?? { hitung: "", catatan: "" };
      return { ...prev, [key]: { ...prevEntry, ...patch } };
    });
  };

  const parseHitung = (v: string | undefined): number | null => {
    if (v === undefined || v === "") return null;
    const n = Number(v);
    if (!Number.isFinite(n) || n < 0) return null;
    return Math.floor(n);
  };

  const handleFinish = () => {
    const changes: {
      row: SkuRow;
      before: number;
      after: number;
      diff: number;
      catatan: string;
    }[] = [];
    for (const r of allRows) {
      const e = entries[r.key];
      const hitung = parseHitung(e?.hitung);
      if (hitung === null) continue;
      if (hitung === r.totalStok) continue;
      changes.push({
        row: r,
        before: r.totalStok,
        after: hitung,
        diff: hitung - r.totalStok,
        catatan: e?.catatan?.trim() || "",
      });
    }

    if (changes.length === 0) {
      toast.error("Belum ada SKU dengan hasil penghitungan yang berbeda.");
      return;
    }

    // Kelompokkan per produk agar update variants sekali per produk.
    const byProduct = new Map<string, typeof changes>();
    for (const c of changes) {
      const list = byProduct.get(c.row.productId) ?? [];
      list.push(c);
      byProduct.set(c.row.productId, list);
    }

    for (const [productId, list] of byProduct) {
      const p = productStore.getById(productId);
      if (!p) continue;
      if (p.variants && p.variants.length > 0) {
        const nextVariants = p.variants.map((v, i) => {
          const c = list.find((x) => x.row.variantIndex === i);
          if (!c) return v;
          return { ...v, stok: c.after };
        });
        const nextTotal = nextVariants.reduce((s, v) => s + (v.stok ?? 0), 0);
        productStore.updateProduct(productId, {
          variants: nextVariants,
          stok: nextTotal,
        });
      } else {
        const c = list[0];
        productStore.updateProduct(productId, { stok: c.after });
      }
    }

    stockHistoryStore.record(
      changes.map((c) => ({
        transactionType: "STOCK_OPNAME" as const,
        referenceNo: "",
        productId: c.row.productId,
        variantIndex: c.row.variantIndex,
        sku: c.row.sku,
        productName: c.row.namaProduk,
        variation: c.row.variasi,
        warehouse: "Gudang Utama",
        beforeStock: c.before,
        changeQty: c.after - c.before,
        afterStock: c.after,
        note: c.catatan || undefined,
      })),
    );


    toast.success(
      `Stock Opname selesai. ${changes.length} SKU diperbarui ke stok fisik.`,
    );
    setEntries({});
  };

  const handleSaveDraft = () => {
    const count = Object.values(entries).filter(
      (e) => parseHitung(e.hitung) !== null,
    ).length;
    toast.success(
      count > 0
        ? `Draf penghitungan disimpan sementara (${count} SKU).`
        : "Draf kosong disimpan.",
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Stock Opname"
        description="Isi jumlah hasil hitung fisik. Nilai ini akan menggantikan stok ERP saat Akhiri Penghitungan ditekan."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={handleSaveDraft}>
              Simpan Draf
            </Button>
            <Button onClick={handleFinish}>Akhiri Penghitungan</Button>
          </div>
        }
      />

      <Card className="p-4">
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama produk, SKU, atau variasi..."
            className="h-10 pl-9"
          />
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Informasi SKU</th>
                <th className="px-4 py-3 text-right font-medium">Total Stok</th>
                <th className="px-4 py-3 text-right font-medium">Dialokasikan</th>
                <th className="px-4 py-3 text-left font-medium">
                  Jumlah Penghitungan
                </th>
                <th className="px-4 py-3 text-left font-medium">
                  Hasil Penghitungan
                </th>
                <th className="px-4 py-3 text-left font-medium">Catatan</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {visibleRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-muted-foreground">
                    {allRows.length === 0
                      ? "Belum ada produk Live pada Master Produk."
                      : "Tidak ada SKU yang cocok dengan pencarian."}
                  </td>
                </tr>
              ) : (
                visibleRows.map((r) => {
                  const e = entries[r.key];
                  const hitung = parseHitung(e?.hitung);
                  let hasil: React.ReactNode = (
                    <span className="text-muted-foreground">Belum Dihitung</span>
                  );
                  if (hitung !== null) {
                    const diff = hitung - r.totalStok;
                    if (diff > 0) {
                      hasil = (
                        <span className="font-medium text-emerald-600">
                          Bertambah +{diff}
                        </span>
                      );
                    } else if (diff < 0) {
                      hasil = (
                        <span className="font-medium text-red-600">
                          Berkurang {diff}
                        </span>
                      );
                    } else {
                      hasil = (
                        <span className="font-medium text-muted-foreground">
                          Sesuai
                        </span>
                      );
                    }
                  }
                  return (
                    <tr key={r.key} className="align-top hover:bg-muted/20">
                      <td className="px-4 py-3">
                        <div className="flex items-start gap-3">
                          {r.imageUrl ? (
                            <img
                              src={r.imageUrl}
                              alt={r.namaProduk}
                              className="h-12 w-12 rounded-md border object-cover"
                            />
                          ) : (
                            <div className="h-12 w-12 rounded-md border bg-muted" />
                          )}
                          <div className="min-w-0">
                            <div className="font-mono text-xs text-primary">
                              {r.sku}
                            </div>
                            <div className="truncate text-sm font-medium">
                              {r.namaProduk}
                            </div>
                            {r.variasi !== "-" && (
                              <div className="text-xs text-muted-foreground">
                                {r.variasi}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {r.totalStok}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                        {r.dialokasikan}
                      </td>
                      <td className="px-4 py-3">
                        <Input
                          type="number"
                          min={0}
                          inputMode="numeric"
                          value={e?.hitung ?? ""}
                          onChange={(ev) =>
                            updateEntry(r.key, { hitung: ev.target.value })
                          }
                          placeholder="0"
                          className={cn("h-9 w-24 tabular-nums")}
                        />
                      </td>
                      <td className="px-4 py-3 text-sm">{hasil}</td>
                      <td className="px-4 py-3">
                        <Textarea
                          value={e?.catatan ?? ""}
                          onChange={(ev) =>
                            updateEntry(r.key, { catatan: ev.target.value })
                          }
                          placeholder="Catatan..."
                          rows={1}
                          className="min-h-9 w-56 resize-none"
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
