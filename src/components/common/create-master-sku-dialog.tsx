import { useEffect, useMemo, useState } from "react";
import { RefreshCw, Sparkles, Package2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { MasterProduct } from "@/data/products";
import { cn } from "@/lib/utils";

type Props = {
  product: MasterProduct | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: "create" | "manage";
};

const warehouses = ["Gudang Pusat Jakarta", "Gudang Bandung", "Gudang Surabaya"];
const categories = [
  "Fashion Pria",
  "Fashion Wanita",
  "Sepatu",
  "Tas",
  "Aksesoris",
  "Elektronik",
];

const autoGenSku = (name: string) => {
  const clean = name
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .join("-");
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `MSKU-${clean || "PRD"}-${suffix}`;
};

export function CreateMasterSkuDialog({
  product,
  open,
  onOpenChange,
  mode = "create",
}: Props) {
  const isManage = mode === "manage";
  const [masterSku, setMasterSku] = useState("");
  const [warehouse, setWarehouse] = useState(warehouses[0]);
  const [category, setCategory] = useState<string>("");
  const [cost, setCost] = useState("");
  const [price, setPrice] = useState("");
  const [weight, setWeight] = useState("");
  const [dimension, setDimension] = useState("");
  const [notes, setNotes] = useState("");
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!product) return;
    setMasterSku(isManage ? product.masterSku : autoGenSku(product.name));
    setCategory(product.category);
    setCost(String(product.modal));
    setPrice(String(product.price));
    setWeight("");
    setDimension("");
    setNotes("");
    setSelected(
      Object.fromEntries(product.variations.map((v) => [v.id, true])),
    );
  }, [product, isManage, open]);

  const selectedCount = useMemo(
    () => Object.values(selected).filter(Boolean).length,
    [selected],
  );

  if (!product) return null;

  const handleSubmit = () => {
    toast.success(
      isManage
        ? `Master SKU "${masterSku}" diperbarui (mock)`
        : `Master SKU "${masterSku}" dibuat dengan ${selectedCount} variasi (mock)`,
    );
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package2 className="h-5 w-5 text-primary" />
            {isManage ? "Kelola Master SKU" : "Buat Master SKU"}
          </DialogTitle>
          <DialogDescription>
            {isManage
              ? "Perbarui informasi Master SKU dan variasi yang aktif."
              : "Aktifkan produk marketplace menjadi Master SKU. Setiap variasi akan menjadi item stok gudang."}
          </DialogDescription>
        </DialogHeader>

        {/* Product preview */}
        <div className="flex gap-4 rounded-lg border bg-muted/30 p-4">
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-20 w-20 shrink-0 rounded-md border object-cover"
          />
          <div className="min-w-0 space-y-1.5">
            <p className="truncate text-base font-semibold text-foreground">
              {product.name}
            </p>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <Badge variant="outline">{product.marketplace}</Badge>
              <Badge variant="outline">{product.productStatus}</Badge>
              <span className="font-mono text-muted-foreground">
                {product.productId}
              </span>
            </div>
          </div>
        </div>

        {/* Variations */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">
              Variasi Terdeteksi ({product.variations.length})
            </Label>
            <span className="text-xs text-muted-foreground">
              {selectedCount} dipilih
            </span>
          </div>
          <div className="grid gap-2 rounded-lg border p-3 sm:grid-cols-2">
            {product.variations.map((v) => {
              const checked = !!selected[v.id];
              return (
                <label
                  key={v.id}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-md border bg-background p-2.5 text-sm transition-colors",
                    checked
                      ? "border-primary/50 bg-primary/5"
                      : "hover:bg-muted/50",
                  )}
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={(v2) =>
                      setSelected((s) => ({ ...s, [v.id]: !!v2 }))
                    }
                  />
                  <img
                    src={v.imageUrl}
                    alt={v.name}
                    className="h-8 w-8 rounded object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-foreground">
                      {v.name}
                    </p>
                    <p className="truncate font-mono text-[11px] text-muted-foreground">
                      {v.sku}
                    </p>
                  </div>
                </label>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground">
            Setiap variasi terpilih akan otomatis menjadi item stok di gudang.
          </p>
        </div>

        {/* Form */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="master-sku">Master SKU</Label>
            <div className="mt-1.5 flex gap-2">
              <Input
                id="master-sku"
                value={masterSku}
                onChange={(e) => setMasterSku(e.target.value)}
                className="font-mono"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => setMasterSku(autoGenSku(product.name))}
              >
                <RefreshCw className="h-4 w-4" />
                Auto Generate
              </Button>
            </div>
          </div>

          <div>
            <Label htmlFor="warehouse">Gudang</Label>
            <Select value={warehouse} onValueChange={setWarehouse}>
              <SelectTrigger id="warehouse" className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {warehouses.map((w) => (
                  <SelectItem key={w} value={w}>
                    {w}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="category">Kategori</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="category" className="mt-1.5">
                <SelectValue placeholder="Pilih kategori" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="cost">Harga Modal Referensi</Label>
            <Input
              id="cost"
              inputMode="numeric"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              className="mt-1.5"
              placeholder="0"
            />
          </div>

          <div>
            <Label htmlFor="price">Harga Jual Referensi</Label>
            <Input
              id="price"
              inputMode="numeric"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="mt-1.5"
              placeholder="0"
            />
          </div>

          <div>
            <Label htmlFor="weight">Berat (gram)</Label>
            <Input
              id="weight"
              inputMode="numeric"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="mt-1.5"
              placeholder="500"
            />
          </div>

          <div>
            <Label htmlFor="dimension">Dimensi (P × L × T cm)</Label>
            <Input
              id="dimension"
              value={dimension}
              onChange={(e) => setDimension(e.target.value)}
              className="mt-1.5"
              placeholder="30 × 20 × 5"
            />
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="notes">Catatan</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1.5"
              rows={3}
              placeholder="Catatan internal untuk Master SKU ini..."
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button onClick={handleSubmit} disabled={selectedCount === 0}>
            <Sparkles className="h-4 w-4" />
            {isManage ? "Simpan Perubahan" : "Buat Master SKU"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
