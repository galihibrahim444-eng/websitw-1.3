import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/page-header";
import { PlaceholderTable } from "@/components/common/placeholder-table";

export const Route = createFileRoute("/_app/stok")({
  head: () => ({ meta: [{ title: "Stok — MAQIL.ERP" }] }),
  component: () => (
    <div className="space-y-6">
      <PageHeader title="Stok" description="Pantau ketersediaan stok per produk." />
      <PlaceholderTable columns={["SKU", "Produk", "Gudang", "Tersedia", "Status"]} />
    </div>
  ),
});
