import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

import {
  MarketplaceAccountService,
  type MarketplaceAccount,
} from "@/services/marketplaceAccountService";

export type CopyProductDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Toko asal produk (untuk difilter dari daftar tujuan bila cocok). */
  sourceShopName?: string;
  onConfirm: (shop: MarketplaceAccount) => void;
};

export function CopyProductDialog({
  open,
  onOpenChange,
  sourceShopName,
  onConfirm,
}: CopyProductDialogProps) {
  const [shops, setShops] = useState<MarketplaceAccount[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    MarketplaceAccountService.getAllConnectedShops()
      .then((data) => {
        if (cancelled) return;
        setShops(data);
        setSelected("");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  const targets = shops.filter((s) => s.shopName !== sourceShopName);
  const chosen = targets.find((s) => String(s.shopId) === selected);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Salin ke Toko</DialogTitle>
          <DialogDescription>
            Pilih satu toko tujuan. Produk akan disalin sebagai Draft.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            Memuat daftar toko…
          </div>
        ) : targets.length === 0 ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            Tidak ada toko lain yang terhubung.
          </div>
        ) : (
          <RadioGroup value={selected} onValueChange={setSelected} className="space-y-2">
            {targets.map((s) => (
              <label
                key={s.shopId}
                htmlFor={`shop-${s.shopId}`}
                className="flex cursor-pointer items-center gap-3 rounded-md border p-3 hover:bg-muted/50"
              >
                <RadioGroupItem id={`shop-${s.shopId}`} value={String(s.shopId)} />
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{s.shopName}</span>
                  <span className="text-xs text-muted-foreground">{s.marketplace}</span>
                </div>
              </label>
            ))}
          </RadioGroup>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button
            disabled={!chosen}
            onClick={() => {
              if (chosen) onConfirm(chosen);
            }}
          >
            Konfirmasi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}



