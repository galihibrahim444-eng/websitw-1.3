import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { ChevronRight, RefreshCw, Unplug } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useMarketplaceConnection } from "@/hooks/use-marketplace-connections";
import {
  MarketplaceConnectionService,
  type MarketplaceName,
} from "@/services/marketplaceConnectionService";

const VALID: MarketplaceName[] = ["Shopee", "Tokopedia", "TikTok Shop", "Lazada"];

export const Route = createFileRoute("/_app/marketplace/$marketplace")({
  head: ({ params }) => {
    const name = decodeURIComponent(params.marketplace);
    return {
      meta: [
        { title: `${name} — Marketplace | MAQIL.ERP` },
        {
          name: "description",
          content: `Pengaturan koneksi dan sinkronisasi untuk marketplace ${name}.`,
        },
      ],
    };
  },
  component: MarketplaceDetailPage,
});

const DUMMY_MSG = "Fitur akan aktif setelah integrasi Shopee Open API.";

function MarketplaceDetailPage() {
  const { marketplace: raw } = Route.useParams();
  const name = decodeURIComponent(raw) as MarketplaceName;
  const navigate = useNavigate();

  if (!VALID.includes(name)) {
    return (
      <div className="space-y-4">
        <PageHeader title="Marketplace tidak ditemukan" />
        <Button asChild variant="outline">
          <Link to="/marketplace">Kembali</Link>
        </Button>
      </div>
    );
  }

  const conn = useMarketplaceConnection(name);
  if (!conn) return null;

  const handleSync = (label: string) => {
    toast(DUMMY_MSG, { description: `Aksi: ${label} — ${name}` });
  };

  const handleToggle = (
    field: "autoSyncProduct" | "autoSyncOrder" | "autoSyncStock",
    value: boolean,
  ) => {
    MarketplaceConnectionService.update(name, { [field]: value });
  };

  const handleDisconnect = () => {
    MarketplaceConnectionService.disconnect(name);
    toast.success(`Koneksi ${name} diputus (dummy).`, {
      description: DUMMY_MSG,
    });
    navigate({ to: "/marketplace" });
  };

  return (
    <div className="space-y-6">
      <nav className="flex items-center gap-1 text-sm text-muted-foreground">
        <Link to="/marketplace" className="hover:text-foreground">
          Marketplace
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground">{name}</span>
      </nav>

      <PageHeader
        title={name}
        description="Kelola koneksi, sinkronisasi, dan pengaturan otomatis marketplace ini."
      />

      {/* Status & Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Status Koneksi</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <InfoRow
            label="Status"
            value={
              conn.connected ? (
                <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/10 dark:text-emerald-400">
                  🟢 Connected
                </Badge>
              ) : (
                <Badge className="bg-rose-500/10 text-rose-600 hover:bg-rose-500/10 dark:text-rose-400">
                  Disconnected
                </Badge>
              )
            }
          />
          <InfoRow label="Marketplace" value={name} />
          <InfoRow label="Nama Toko" value={conn.shopName || "—"} />
          <InfoRow label="Shop ID" value={conn.shopId || "—"} />
          <InfoRow
            label="Terakhir Sinkron"
            value={conn.lastSync || "—"}
          />
        </CardContent>
      </Card>

      {/* Sinkronisasi manual */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sinkronisasi</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => handleSync("Sinkron Produk")}>
            <RefreshCw className="h-4 w-4" />
            Sinkron Produk
          </Button>
          <Button variant="outline" onClick={() => handleSync("Sinkron Pesanan")}>
            <RefreshCw className="h-4 w-4" />
            Sinkron Pesanan
          </Button>
          <Button variant="outline" onClick={() => handleSync("Sinkron Stock")}>
            <RefreshCw className="h-4 w-4" />
            Sinkron Stock
          </Button>
        </CardContent>
      </Card>

      {/* Pengaturan otomatis */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pengaturan Sinkronisasi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ToggleRow
            title="Sinkron Produk Otomatis"
            desc="Perbarui katalog produk marketplace secara berkala."
            checked={conn.autoSyncProduct}
            onCheckedChange={(v) => handleToggle("autoSyncProduct", v)}
          />
          <Separator />
          <ToggleRow
            title="Sinkron Pesanan Otomatis"
            desc="Tarik pesanan baru dari marketplace ke menu Pesanan."
            checked={conn.autoSyncOrder}
            onCheckedChange={(v) => handleToggle("autoSyncOrder", v)}
          />
          <Separator />
          <ToggleRow
            title="Sinkron Stock Otomatis"
            desc="Kirim stok terbaru ERP ke marketplace berdasarkan Mapping SKU."
            checked={conn.autoSyncStock}
            onCheckedChange={(v) => handleToggle("autoSyncStock", v)}
          />
        </CardContent>
      </Card>

      {/* Akun */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Akun</CardTitle>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Unplug className="h-4 w-4" />
                Putuskan Koneksi
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Putuskan koneksi {name}?</AlertDialogTitle>
                <AlertDialogDescription>
                  Sinkronisasi otomatis akan berhenti. Anda tetap bisa menyambungkan
                  kembali nanti. (Aksi dummy — belum memanggil API.)
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Batal</AlertDialogCancel>
                <AlertDialogAction onClick={handleDisconnect}>
                  Ya, putuskan
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="text-sm font-medium text-foreground">{value}</div>
    </div>
  );
}

function ToggleRow({
  title,
  desc,
  checked,
  onCheckedChange,
}: {
  title: string;
  desc: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}
