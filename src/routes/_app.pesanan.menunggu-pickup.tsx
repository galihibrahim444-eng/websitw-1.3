import { createFileRoute } from "@tanstack/react-router";
import { PesananList } from "@/components/common/pesanan-list";

export const Route = createFileRoute("/_app/pesanan/menunggu-pickup")({
  head: () => ({ meta: [{ title: "Menunggu Pickup — MAQIL.ERP" }] }),
  component: () => (
    <PesananList
      title="Menunggu Pickup"
      description="Paket siap dijemput oleh kurir marketplace."
      statusLabel="Menunggu Pickup"
      statusClass="bg-violet-500/10 text-violet-600 dark:text-violet-400 hover:bg-violet-500/10"
      actions={[{ label: "Cetak Label Pengiriman", variant: "default" }]}
    />
  ),
});
