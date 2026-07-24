import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MAX_VARIATION_NAME_LENGTH } from "@/lib/product-variations";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (name: string) => void;
};

const SUGGESTIONS = ["Warna", "Ukuran", "Motif"];

export function VariationNameDialog({ open, onOpenChange, onConfirm }: Props) {
  const [name, setName] = useState("");

  useEffect(() => {
    if (open) setName("");
  }, [open]);

  const trimmed = name.trim();
  const canConfirm = trimmed.length > 0;

  const handleConfirm = () => {
    if (!canConfirm) return;
    onConfirm(trimmed);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nama Atribut Variasi</DialogTitle>
          <DialogDescription>
            Contoh: Warna, Ukuran, Motif.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="relative">
            <Input
              autoFocus
              value={name}
              onChange={(e) =>
                setName(e.target.value.slice(0, MAX_VARIATION_NAME_LENGTH))
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleConfirm();
                }
              }}
              placeholder="Masukkan nama atribut"
              className="pr-14"
            />
            <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-xs text-muted-foreground">
              {name.length}/{MAX_VARIATION_NAME_LENGTH}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setName(s.slice(0, MAX_VARIATION_NAME_LENGTH))}
                className="rounded-full border border-border bg-muted/40 px-3 py-1 text-xs text-muted-foreground hover:border-violet-300 hover:text-violet-600"
              >
                {s}
              </button>
            ))}
          </div>
          <Label className="text-xs text-muted-foreground">
            Maksimal {MAX_VARIATION_NAME_LENGTH} karakter.
          </Label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!canConfirm}
            className="bg-violet-600 text-white hover:bg-violet-700"
          >
            Konfirmasi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
