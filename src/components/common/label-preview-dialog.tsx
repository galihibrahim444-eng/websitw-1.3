import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { PesananRow } from "@/data/pesanan";

export function LabelPreviewDialog({
  open,
  onOpenChange,
  orders,
  onPrint,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orders: PesananRow[];
  onPrint: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-5xl overflow-hidden">
        <style>{`@media print { body * { visibility: hidden; } #label-print-area, #label-print-area * { visibility: visible; } #label-print-area { position: absolute; left: 0; top: 0; width: 100%; } }`}</style>
        <DialogHeader>
          <DialogTitle>Preview Label Pengiriman</DialogTitle>
          <DialogDescription>
            Lihat preview label sebelum mencetak. Hanya data pesanan terpilih yang akan tampil.
          </DialogDescription>
        </DialogHeader>

        <div id="label-print-area" className="space-y-4 overflow-y-auto px-0 py-4 max-h-[calc(90vh-14rem)]">
          {orders.length === 0 && (
            <div className="rounded-2xl border border-muted/50 bg-muted/10 p-6 text-sm text-muted-foreground">
              Pilih minimal satu pesanan untuk melihat preview label.
            </div>
          )}

          {orders.map((order) => (
            <div
              key={order.id}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50 print:shadow-none"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">
                    Label Pengiriman
                  </p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">{order.id}</p>
                </div>
                <div className="grid gap-1 text-right text-xs text-slate-500">
                  <span>{order.marketplace}</span>
                  <span>{order.store}</span>
                  <span>{order.kurir}</span>
                </div>
              </div>

              <div className="mt-6 grid gap-3 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-4">
                  <div>
                    <p className="text-[0.65rem] uppercase tracking-[0.18em] text-slate-500">Nomor Resi</p>
                    <p className="mt-1 font-medium text-slate-900">{order.resi}</p>
                  </div>
                  <div>
                    <p className="text-[0.65rem] uppercase tracking-[0.18em] text-slate-500">Pembeli</p>
                    <p className="mt-1 font-medium text-slate-900">{order.buyer}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-[0.65rem] uppercase tracking-[0.18em] text-slate-500">Alamat Singkat</p>
                    <p className="mt-1 font-medium text-slate-900">Jl. Contoh No. 123, Jakarta</p>
                  </div>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div>
                    <p className="text-[0.65rem] uppercase tracking-[0.18em] text-slate-500">Marketplace</p>
                    <p className="mt-1 font-medium text-slate-900">{order.marketplace}</p>
                  </div>
                  <div>
                    <p className="text-[0.65rem] uppercase tracking-[0.18em] text-slate-500">Kurir</p>
                    <p className="mt-1 font-medium text-slate-900">{order.kurir}</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 rounded-2xl bg-slate-900 p-4 text-slate-100">
                <div className="mb-3 text-xs uppercase tracking-[0.25em] text-slate-400">
                  Barcode Dummy
                </div>
                <div className="grid h-20 grid-cols-[repeat(24,1fr)] gap-[2px]">
                  {Array.from({ length: 24 }).map((_, index) => (
                    <span
                      key={index}
                      className={index % 3 === 0 ? "block h-full w-full bg-slate-100" : "block h-full w-full bg-slate-300"}
                    />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Tutup
          </Button>
          <Button disabled={orders.length === 0} onClick={onPrint}>
            Cetak
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
