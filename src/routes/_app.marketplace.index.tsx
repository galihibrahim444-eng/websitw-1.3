import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useMarketplaceConnections } from "@/hooks/use-marketplace-connections";
import type { MarketplaceName } from "@/services/marketplaceConnectionService";

export const Route = createFileRoute("/_app/marketplace/")({
  head: () => ({
    meta: [
      { title: "Marketplace — MAQIL.ERP" },
      {
        name: "description",
        content:
          "Pusat pengaturan koneksi marketplace: Shopee, Tokopedia, TikTok Shop, dan Lazada.",
      },
    ],
  }),
  component: MarketplaceIndexPage,
});

const META: Record<MarketplaceName, { initial: string; desc: string }> = {
  Shopee: { initial: "S", desc: "Integrasi toko Shopee" },
  Tokopedia: { initial: "T", desc: "Integrasi toko Tokopedia" },
  "TikTok Shop": { initial: "TT", desc: "Integrasi toko TikTok Shop" },
  Lazada: { initial: "L", desc: "Integrasi toko Lazada" },
};

function MarketplaceIndexPage() {
  const connections = useMarketplaceConnections();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Marketplace"
        description="Pusat pengaturan koneksi marketplace yang terhubung ke MAQIL.ERP."
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {connections.map((m) => {
          const meta = META[m.marketplace];
          return (
            <Card key={m.marketplace}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary font-bold">
                    {meta.initial}
                  </div>
                  {m.connected ? (
                    <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/10 dark:text-emerald-400">
                      Connected
                    </Badge>
                  ) : (
                    <Badge className="bg-rose-500/10 text-rose-600 hover:bg-rose-500/10 dark:text-rose-400">
                      Disconnected
                    </Badge>
                  )}
                </div>
                <p className="mt-4 text-base font-semibold">{m.marketplace}</p>
                <p className="mt-1 text-xs text-muted-foreground">{meta.desc}</p>
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="mt-4 w-full"
                >
                  <Link
                    to="/marketplace/$marketplace"
                    params={{ marketplace: encodeURIComponent(m.marketplace) }}
                  >
                    Kelola
                  </Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
