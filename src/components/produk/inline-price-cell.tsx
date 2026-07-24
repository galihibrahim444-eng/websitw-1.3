import { useEffect, useRef, useState } from "react";
import { Check, Pencil, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  /** Nilai saat ini (undefined = belum diisi). */
  value: number | undefined;
  /** Label untuk aria + toast (contoh: "HPP", "Harga Jual"). */
  label: string;
  /** Placeholder saat value kosong. Default: "-". */
  emptyText?: string;
  /** Boleh kosong (null-able). Untuk HPP produk hasil sinkron. */
  allowEmpty?: boolean;
  /** Dipanggil saat user menekan simpan; nilai null berarti dikosongkan. */
  onSave: (next: number | null) => void;
};

const idr = (n: number) =>
  "IDR " +
  new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(n);

/**
 * Sel harga inline-editable untuk tabel Produk.
 * - Klik ikon pensil untuk masuk mode edit.
 * - Check menyimpan (validasi angka >= 0), X membatalkan.
 * - Update dilakukan lewat callback onSave (product-level).
 */
export function InlinePriceCell({
  value,
  label,
  emptyText = "-",
  allowEmpty = false,
  onSave,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      setDraft(value != null ? String(value) : "");
      // Fokus setelah render.
      requestAnimationFrame(() => inputRef.current?.select());
    }
  }, [editing, value]);

  const commit = () => {
    const trimmed = draft.trim();
    if (!trimmed) {
      if (!allowEmpty) {
        toast.error(`${label} wajib diisi.`);
        return;
      }
      onSave(null);
      setEditing(false);
      return;
    }
    const num = Number(trimmed);
    if (!Number.isFinite(num) || num < 0) {
      toast.error(`${label} tidak valid.`);
      return;
    }
    onSave(num);
    setEditing(false);
  };

  const cancel = () => setEditing(false);

  if (editing) {
    return (
      <div className="flex items-center justify-end gap-1">
        <Input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value.replace(/[^\d]/g, ""))}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            else if (e.key === "Escape") cancel();
          }}
          inputMode="numeric"
          placeholder="0"
          className="h-8 w-28 text-right tabular-nums"
          aria-label={label}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-emerald-600 hover:text-emerald-700"
          onClick={commit}
          aria-label={`Simpan ${label}`}
        >
          <Check className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground"
          onClick={cancel}
          aria-label={`Batal ${label}`}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-end gap-1">
      <span className="text-sm tabular-nums">
        {value != null && value > 0 ? (
          idr(value)
        ) : (
          <span className="text-muted-foreground">{emptyText}</span>
        )}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-6 w-6 text-muted-foreground hover:text-foreground"
        onClick={() => setEditing(true)}
        aria-label={`Edit ${label}`}
      >
        <Pencil className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
