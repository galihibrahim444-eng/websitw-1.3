import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";
import { productStore, isLowStock } from "@/lib/product-store";
import { Button } from "@/components/ui/button";

// Flag modul: pastikan toast hanya tampil sekali per sesi (per page load).
// Reset otomatis ketika browser di-refresh atau user login ulang (SPA remount).
let shownThisSession = false;

/**
 * Menampilkan toast peringatan Stok Menipis satu kali per sesi.
 * Sumber data: productStore (siap dipertukar dengan REST/Shopee API).
 */
export function LowStockNotification() {
  const navigate = useNavigate();

  useEffect(() => {
    if (shownThisSession) return;
    const lowStockCount = productStore
      .getAll()
      .filter((p) => p.status === "live" && isLowStock(p)).length;
    if (lowStockCount <= 0) return;

    shownThisSession = true;
    const toastId = toast.custom(
      (id) => (
        <div className="flex w-[380px] gap-3 rounded-lg border border-amber-200 bg-white p-4 shadow-lg">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
          </div>
          <div className="flex-1 space-y-2">
            <div className="text-base font-semibold text-foreground">Stock Menipis</div>
            <p className="text-sm text-muted-foreground">
              Terdapat {lowStockCount} produk yang memiliki stok menipis. Segera lakukan
              restock.
            </p>
            <div className="flex gap-2 pt-1">
              <Button
                size="sm"
                className="bg-amber-600 text-white hover:bg-amber-700"
                onClick={() => {
                  toast.dismiss(id);
                  navigate({ to: "/produk", search: { filter: "low-stock" } as never });
                }}
              >
                Lihat Produk
              </Button>
              <Button size="sm" variant="outline" onClick={() => toast.dismiss(id)}>
                Tutup
              </Button>
            </div>
          </div>
        </div>
      ),
      { duration: Infinity },
    );
    return () => {
      toast.dismiss(toastId);
    };
  }, [navigate]);

  return null;
}
