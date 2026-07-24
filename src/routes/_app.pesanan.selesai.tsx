import { createFileRoute } from "@tanstack/react-router";
import { PesananList } from "@/components/common/pesanan-list";

export const Route = createFileRoute("/_app/pesanan/selesai")({
  head: () => ({ meta: [{ title: "Pesanan Selesai — MAQIL.ERP" }] }),
  component: () => (
    <PesananList
      title="Pesanan Selesai"
      description="Pesanan yang telah diterima pembeli."
      statusLabel="Selesai"
      statusClass="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
      actions={[{ label: "Export CSV", variant: "outline" }]}
    />
  ),
});
