import { useMemo } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useProducts } from "@/lib/product-store";
import type { ReportFilter } from "@/services/reportService";

const MARKETPLACES = ["Shopee", "Tokopedia", "TikTok Shop", "Lazada"];

export function ReportFilterBar({
  value,
  onChange,
}: {
  value: ReportFilter;
  onChange: (next: ReportFilter) => void;
}) {
  const products = useProducts();

  const kategoriOptions = useMemo(() => {
    const s = new Set<string>();
    for (const p of products) if (p.kategori) s.add(p.kategori);
    return [...s].sort();
  }, [products]);

  const productOptions = useMemo(
    () =>
      products
        .filter((p) => p.status === "live")
        .map((p) => ({ id: p.id, name: p.namaProduk })),
    [products],
  );

  const set = (patch: Partial<ReportFilter>) => onChange({ ...value, ...patch });

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
        <FilterField label="Marketplace">
          <Select
            value={value.marketplace ?? "all"}
            onValueChange={(v) => set({ marketplace: v })}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Marketplace</SelectItem>
              {MARKETPLACES.map((m) => (
                <SelectItem key={m} value={m}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterField>

        <FilterField label="Gudang">
          <Select
            value={value.gudang ?? "all"}
            onValueChange={(v) => set({ gudang: v })}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Gudang</SelectItem>
              <SelectItem value="gudang-utama">Gudang Utama</SelectItem>
            </SelectContent>
          </Select>
        </FilterField>

        <FilterField label="Kategori">
          <Select
            value={value.kategori ?? "all"}
            onValueChange={(v) => set({ kategori: v })}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Kategori</SelectItem>
              {kategoriOptions.map((k) => (
                <SelectItem key={k} value={k}>{k}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterField>

        <FilterField label="Produk">
          <Select
            value={value.productId ?? "all"}
            onValueChange={(v) => set({ productId: v })}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent className="max-h-72">
              <SelectItem value="all">Semua Produk</SelectItem>
              {productOptions.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterField>

        <FilterField label="Dari Tanggal">
          <Input
            type="date"
            value={value.from ?? ""}
            onChange={(e) => set({ from: e.target.value || undefined })}
          />
        </FilterField>

        <FilterField label="Sampai Tanggal">
          <Input
            type="date"
            value={value.to ?? ""}
            onChange={(e) => set({ to: e.target.value || undefined })}
          />
        </FilterField>
      </div>

      <div className="mt-3 flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            onChange({
              marketplace: "all",
              gudang: "all",
              kategori: "all",
              productId: "all",
              from: undefined,
              to: undefined,
            })
          }
        >
          <X className="mr-2 h-4 w-4" /> Reset Filter
        </Button>
      </div>
    </div>
  );
}

function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

export const DEFAULT_REPORT_FILTER: ReportFilter = {
  marketplace: "all",
  gudang: "all",
  kategori: "all",
  productId: "all",
};
