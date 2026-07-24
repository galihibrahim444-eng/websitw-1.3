import { createFileRoute } from "@tanstack/react-router";
import { ProductTableView } from "@/components/produk/product-table-view";

export const Route = createFileRoute("/_app/produk/")({
  head: () => ({ meta: [{ title: "Produk — MAQIL.ERP" }] }),
  component: () => (
    <ProductTableView
      title="Live"
      description="Produk yang sedang tayang di marketplace."
      statusFilter="live"
    />
  ),
});
