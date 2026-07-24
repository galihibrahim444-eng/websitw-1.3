import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ProductMedia } from "@/lib/product-media";
import type { ProductVariationOption } from "@/lib/product-variations";
import {
  buildVariantCombinations,
  emptyProductVariant,
  type ProductVariant,
} from "@/lib/variant-sku";
import { generateVariantSku } from "@/lib/product-sku";

type Props = {
  variations: ProductVariationOption[];
  media: ProductMedia;
  variants: Record<string, ProductVariant>;
  parentSku?: string;
  onChange: (next: Record<string, ProductVariant>) => void;
};

export function VariantSkuTable({
  variations,
  media,
  variants,
  parentSku = "",
  onChange,
}: Props) {
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkPrice, setBulkPrice] = useState("");
  const [bulkStockOpen, setBulkStockOpen] = useState(false);
  const [bulkStock, setBulkStock] = useState("");
  const [regenOpen, setRegenOpen] = useState(false);
  const combinations = useMemo(
    () => buildVariantCombinations(variations),
    [variations],
  );

  // Sinkronisasi peta ProductVariant: pertahankan entri valid, buang yang stale.
  useEffect(() => {
    const validKeys = new Set(combinations.map((c) => c.key));
    const currentKeys = Object.keys(variants);
    const needsPrune = currentKeys.some((k) => !validKeys.has(k));
    const needsSeed = combinations.some((c) => !variants[c.key]);
    if (!needsPrune && !needsSeed) return;
    const next: Record<string, ProductVariant> = {};
    for (const c of combinations) {
      next[c.key] = variants[c.key] ?? emptyProductVariant();
    }
    onChange(next);
  }, [combinations, variants, onChange]);

  if (combinations.length === 0) return null;

  // Header grup mengikuti urutan grup pertama dari kombinasi.
  const headerGroups = combinations[0].parts.map((p, index) => ({
    groupId: p.groupId,
    groupName: p.groupName || `Variasi ${index + 1}`,
  }));
  const findImageUrl = (mediaId?: string) =>
    mediaId ? media.images.find((img) => img.id === mediaId)?.url : undefined;

  const updateCell = (key: string, patch: Partial<ProductVariant>) => {
    onChange({
      ...variants,
      [key]: { ...(variants[key] ?? emptyProductVariant()), ...patch },
    });
  };

  return (
    <div className="rounded-md border bg-background overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">Gambar</TableHead>
            {headerGroups.map((g) => (
              <TableHead key={g.groupId}>{g.groupName}</TableHead>
            ))}
            <TableHead className="w-40">
              <div className="flex items-center justify-between gap-2">
                <span>Buat SKU</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const next: Record<string, ProductVariant> = {
                        ...variants,
                      };
                      for (const c of combinations) {
                        const cur = next[c.key] ?? emptyProductVariant();
                        if (cur.sku.trim().length > 0) continue;
                        next[c.key] = {
                          ...cur,
                          sku: generateVariantSku({
                            parentSku,
                            options: c.parts.map((p) => p.valueLabel),
                          }),
                        };
                      }
                      onChange(next);
                    }}
                    className="text-xs font-medium text-violet-600 hover:underline"
                  >
                    Buat SKU
                  </button>
                  <button
                    type="button"
                    onClick={() => setRegenOpen(true)}
                    className="text-xs font-medium text-violet-600 hover:underline"
                  >
                    Generate Ulang
                  </button>
                </div>
              </div>
            </TableHead>
            <TableHead className="w-40">
              <div className="flex items-center justify-between gap-2">
                <span>Harga</span>
                <button
                  type="button"
                  onClick={() => {
                    setBulkPrice("");
                    setBulkOpen(true);
                  }}
                  className="text-xs font-medium text-violet-600 hover:underline"
                >
                  Edit Massal
                </button>
              </div>
            </TableHead>
            <TableHead className="w-32">
              <div className="flex items-center justify-between gap-2">
                <span>Stok</span>
                <button
                  type="button"
                  onClick={() => {
                    setBulkStock("");
                    setBulkStockOpen(true);
                  }}
                  className="text-xs font-medium text-violet-600 hover:underline"
                >
                  Edit Massal
                </button>
              </div>
            </TableHead>
            <TableHead className="w-24">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {combinations.map((combo) => {
            const data = variants[combo.key] ?? emptyProductVariant();
            const imageUrl = findImageUrl(
              combo.parts.find((p) => p.imageMediaId)?.imageMediaId,
            );
            return (
              <TableRow key={combo.key}>
                <TableCell>
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt=""
                      className="h-10 w-10 rounded object-cover"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded border border-dashed bg-muted" />
                  )}
                </TableCell>
                {combo.parts.map((p) => (
                  <TableCell key={p.valueId} className="font-medium">
                    {p.valueLabel}
                  </TableCell>
                ))}
                <TableCell>
                  {data.sku.trim().length === 0 ? (
                    <button
                      type="button"
                      onClick={() =>
                        updateCell(combo.key, {
                          sku: generateVariantSku({
                            parentSku,
                            options: combo.parts.map((p) => p.valueLabel),
                          }),
                        })
                      }
                      className="text-sm font-medium text-violet-600 hover:underline"
                    >
                      Buat SKU
                    </button>
                  ) : (
                    <Input
                      value={data.sku}
                      onChange={(e) =>
                        updateCell(combo.key, { sku: e.target.value })
                      }
                      placeholder="SKU"
                    />
                  )}
                </TableCell>
                <TableCell>
                  <Input
                    inputMode="numeric"
                    value={data.price}
                    onChange={(e) =>
                      updateCell(combo.key, {
                        price: e.target.value.replace(/[^\d]/g, ""),
                      })
                    }
                    placeholder="0"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    inputMode="numeric"
                    value={data.stock}
                    onChange={(e) =>
                      updateCell(combo.key, {
                        stock: e.target.value.replace(/[^\d]/g, ""),
                      })
                    }
                    placeholder="0"
                  />
                </TableCell>
                <TableCell>
                  <Switch
                    checked={data.status === "aktif"}
                    onCheckedChange={(checked) =>
                      updateCell(combo.key, {
                        status: checked ? "aktif" : "nonaktif",
                      })
                    }
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit Massal Harga</DialogTitle>
            <DialogDescription>
              Harga akan diterapkan ke seluruh variasi. Anda tetap bisa
              mengubahnya per baris setelahnya.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="bulk-price">Harga</Label>
            <Input
              id="bulk-price"
              autoFocus
              inputMode="numeric"
              value={bulkPrice}
              onChange={(e) =>
                setBulkPrice(e.target.value.replace(/[^\d]/g, ""))
              }
              placeholder="0"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkOpen(false)}>
              Batal
            </Button>
            <Button
              disabled={bulkPrice.trim().length === 0}
              onClick={() => {
                const next: Record<string, ProductVariant> = {};
                for (const c of combinations) {
                  next[c.key] = {
                    ...(variants[c.key] ?? emptyProductVariant()),
                    price: bulkPrice,
                  };
                }
                onChange(next);
                setBulkOpen(false);
              }}
              className="bg-violet-600 text-white hover:bg-violet-700"
            >
              Terapkan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={bulkStockOpen} onOpenChange={setBulkStockOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit Massal Stok</DialogTitle>
            <DialogDescription>
              Stok akan diterapkan ke seluruh variasi. Anda tetap bisa
              mengubahnya per baris setelahnya.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="bulk-stock">Stok</Label>
            <Input
              id="bulk-stock"
              autoFocus
              inputMode="numeric"
              value={bulkStock}
              onChange={(e) =>
                setBulkStock(e.target.value.replace(/[^\d]/g, ""))
              }
              placeholder="0"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkStockOpen(false)}>
              Batal
            </Button>
            <Button
              disabled={bulkStock.trim().length === 0}
              onClick={() => {
                const next: Record<string, ProductVariant> = {};
                for (const c of combinations) {
                  next[c.key] = {
                    ...(variants[c.key] ?? emptyProductVariant()),
                    stock: bulkStock,
                  };
                }
                onChange(next);
                setBulkStockOpen(false);
              }}
              className="bg-violet-600 text-white hover:bg-violet-700"
            >
              Terapkan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={regenOpen} onOpenChange={setRegenOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Generate Ulang SKU</DialogTitle>
            <DialogDescription>
              Generate ulang akan mengganti seluruh SKU yang sudah ada.
              Lanjutkan?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRegenOpen(false)}>
              Batal
            </Button>
            <Button
              onClick={() => {
                const next: Record<string, ProductVariant> = {};
                for (const c of combinations) {
                  next[c.key] = {
                    ...(variants[c.key] ?? emptyProductVariant()),
                    sku: generateVariantSku({
                      parentSku,
                      options: c.parts.map((p) => p.valueLabel),
                    }),
                  };
                }
                onChange(next);
                setRegenOpen(false);
              }}
              className="bg-violet-600 text-white hover:bg-violet-700"
            >
              Ya
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
