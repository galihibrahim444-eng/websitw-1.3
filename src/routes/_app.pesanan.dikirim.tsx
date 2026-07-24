import { createFileRoute } from "@tanstack/react-router";
import { PesananList } from "@/components/common/pesanan-list";

export const Route = createFileRoute("/_app/pesanan/dikirim")({
  head: () => ({ meta: [{ title: "Pesanan Dikirim — MAQIL.ERP" }] }),
  component: () => (
    <PesananList
      title="Pesanan Dikirim"
      description="Paket yang sedang dalam perjalanan ke pembeli."
      statusLabel="Dikirim"
      statusClass="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
      actions={[
        { label: "Lacak Resi", variant: "default" },
        { label: "Aksi Massal", variant: "outline" },
      ]}
    />
  ),
});
