import { createFileRoute } from "@tanstack/react-router";
import { PesananList } from "@/components/common/pesanan-list";

export const Route = createFileRoute("/_app/pesanan/menunggu-diproses")({
  head: () => ({ meta: [{ title: "Menunggu Diproses — MAQIL.ERP" }] }),
  component: () => (
    <PesananList
      title="Menunggu Diproses"
      description="Pesanan baru yang belum diproses tim gudang."
      statusLabel="Menunggu Diproses"
      statusClass="bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
      actions={[
        { label: "Proses", variant: "default" },
        { label: "Cetak Massal", variant: "outline" },
        { label: "Aksi Massal", variant: "outline" },
      ]}
    />
  ),
});
