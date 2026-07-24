import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { X } from "lucide-react";

type MarketplaceMappingDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productName?: string | null;
  masterSku?: string | null;
  connected: boolean;
  totalMarketplace: number;
  totalSku: number;
};

const availableMarketplaces = [
  { name: "Shopee", logo: "S" },
  { name: "Tokopedia", logo: "T" },
  { name: "TikTok Shop", logo: "TT" },
  { name: "Lazada", logo: "L" },
];

const getMarketplaceCards = (connected: boolean, totalMarketplace: number, totalSku: number) => {
  const baseSkus = [
    ["GALIH-HITAM-M", "GALIH-HITAM-L", "GALIH-PUTIH-M"],
    ["GALIH-TOKO-01", "GALIH-TOKO-02"],
    ["GALIH-VIDEO-01"],
    [],
  ];
  const connectedCount = connected ? Math.min(totalMarketplace, availableMarketplaces.length) : 0;

  return availableMarketplaces.map((marketplace, index) => {
    const isConnected = connected && index < connectedCount;
    return {
      ...marketplace,
      connected: isConnected,
      skus: isConnected ? baseSkus[index] : [],
    };
  });
};

export function MarketplaceMappingDrawer({
  open,
  onOpenChange,
  productName,
  masterSku,
  connected,
  totalMarketplace,
  totalSku,
}: MarketplaceMappingDrawerProps) {
  const marketplaceCards = getMarketplaceCards(connected, totalMarketplace, totalSku);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[75vh]">
        <DrawerHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <DrawerTitle>Mapping SKU Marketplace</DrawerTitle>
              <DrawerDescription>Detail sementara untuk SKU {masterSku ?? "—"}.</DrawerDescription>
            </div>
            <DrawerClose asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <X className="h-4 w-4" />
              </Button>
            </DrawerClose>
          </div>
        </DrawerHeader>

        <div className="space-y-5 px-4 pb-4">
          <Card className="border">
            <CardHeader className="p-4 pb-0">
              <CardTitle className="text-base font-semibold">Ringkasan Produk</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 p-4 pt-0 sm:grid-cols-2">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Nama Produk</p>
                <p className="font-medium leading-6">{productName ?? "—"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Master SKU</p>
                <p className="font-medium leading-6">{masterSku ?? "—"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Marketplace Terhubung</p>
                <p className="font-medium leading-6">{totalMarketplace}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total SKU Marketplace</p>
                <p className="font-medium leading-6">{totalSku}</p>
              </div>
            </CardContent>
          </Card>

          <div className="rounded-lg border bg-muted p-4">
            <p className="text-sm font-semibold text-foreground">Ringkasan Mapping</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {connected
                ? `${totalSku} SKU terhubung ke ${Math.min(totalMarketplace, 4)} marketplace.`
                : "SKU ini belum memiliki mapping marketplace."}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {marketplaceCards.map((marketplace) => (
              <Card key={marketplace.name} className="border">
                <CardHeader className="flex items-center justify-between gap-3 p-4 pb-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-semibold text-foreground">
                    {marketplace.logo}
                  </div>
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-base font-semibold">{marketplace.name}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 p-4 pt-0">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Status Mapping</p>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          marketplace.connected
                            ? marketplace.skus.length > 1
                              ? "default"
                              : "secondary"
                            : "destructive"
                        }
                      >
                        {marketplace.connected
                          ? marketplace.skus.length > 1
                            ? "Terhubung"
                            : "Sebagian"
                          : "Belum Terhubung"}
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-foreground">SKU Marketplace</p>
                    {marketplace.skus.length > 0 ? (
                      <div className="space-y-1 text-sm text-muted-foreground">
                        {marketplace.skus.map((sku) => (
                          <div key={sku}>{sku}</div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Belum ada SKU yang terhubung.</p>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="justify-end gap-2 p-4 pt-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      toast("Halaman Mapping SKU Marketplace akan tersedia pada tahap berikutnya.")
                    }
                  >
                    Kelola
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
