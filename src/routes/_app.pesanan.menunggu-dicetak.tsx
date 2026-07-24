import { createFileRoute } from "@tanstack/react-router";
import { PesananList } from "@/components/common/pesanan-list";

export const Route = createFileRoute("/_app/pesanan/menunggu-dicetak")({
  head: () => ({ meta: [{ title: "Menunggu Dicetak — MAQIL.ERP" }] }),
  component: () => (
    <PesananList
      title="Menunggu Dicetak"
      description="Pesanan yang siap dicetak label pengirimannya."
      statusLabel="Menunggu Dicetak"
      statusClass="bg-sky-500/10 text-sky-600 dark:text-sky-400 hover:bg-sky-500/10"
      actions={[
        { label: "Proses", variant: "default" },
        { label: "Cetak Label Pengiriman", variant: "default" },
        { label: "Scan dan Kirim", variant: "outline" },
        { label: "Aksi Massal", variant: "outline" },
      ]}
    />
  ),
});
