import { createFileRoute } from "@tanstack/react-router";
import { PesananList } from "@/components/common/pesanan-list";

export const Route = createFileRoute("/_app/pesanan/dibatalkan")({
  head: () => ({ meta: [{ title: "Pesanan Dibatalkan — MAQIL.ERP" }] }),
  component: () => (
    <PesananList
      title="Pesanan Dibatalkan"
      description="Pesanan yang dibatalkan pembeli atau sistem."
      statusLabel="Dibatalkan"
      statusClass="bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10"
      actions={[{ label: "Export CSV", variant: "outline" }]}
    />
  ),
});
