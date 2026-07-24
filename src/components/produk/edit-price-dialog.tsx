import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Wallet } from "lucide-react";
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
import { productStore, type StoredProduct } from "@/lib/product-store";

type Props = {
  product: StoredProduct | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const sanitize = (v: string) => v.replace(/[^\d]/g, "");

/**
 * Dialog Edit Harga cepat untuk halaman Produk Live.
 * Mengupdate Harga Modal (HPP) dan Harga Jual product-level.
 * Harga Jual otomatis mengalir ke `harga` produk dan seluruh variasi
 * agar semua tampilan realtime tanpa refresh.
 */
export function EditPriceDialog({ product, open, onOpenChange }: Props) {
  const [hpp, setHpp] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");

  useEffect(() => {
    if (!product) return;
    setHpp(product.hpp ? String(product.hpp) : "");
    setSellingPrice(
      String(product.sellingPrice ?? product.harga ?? ""),
    );
  }, [product, open]);

  if (!product) return null;

  const handleSave = () => {
    const hppNum = hpp ? Number(hpp) : NaN;
    const priceNum = sellingPrice ? Number(sellingPrice) : NaN;

    if (!sellingPrice || !Number.isFinite(priceNum) || priceNum <= 0) {
      toast.error("Harga Jual wajib diisi dan lebih dari 0.");
      return;
    }

    const nextHpp =
      hpp && Number.isFinite(hppNum) && hppNum >= 0 ? hppNum : undefined;

    const nextVariants =
      product.variants && product.variants.length > 0
        ? product.variants.map((v) => ({ ...v, harga: priceNum }))
        : product.variants;

    productStore.updateProduct(product.id, {
      hpp: nextHpp,
      sellingPrice: priceNum,
      harga: priceNum,
      variants: nextVariants,
    });

    toast.success("Harga berhasil diperbarui.");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            Edit Harga
          </DialogTitle>
          <DialogDescription className="line-clamp-2">
            {product.namaProduk}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="edit-hpp">Harga Modal (HPP)</Label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                Rp
              </span>
              <Input
                id="edit-hpp"
                inputMode="numeric"
                placeholder="0"
                className="pl-9"
                value={hpp}
                onChange={(e) => setHpp(sanitize(e.target.value))}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Biaya modal produk. Berlaku untuk seluruh variasi.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-price">Harga Jual</Label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                Rp
              </span>
              <Input
                id="edit-price"
                inputMode="numeric"
                placeholder="0"
                className="pl-9"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(sanitize(e.target.value))}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Harga jual default. Berlaku untuk seluruh variasi.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button onClick={handleSave}>Simpan</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
