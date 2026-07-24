import { useSyncExternalStore } from "react";
import {
  MarketplaceConnectionService,
  type MarketplaceConnectionDetail,
  type MarketplaceName,
} from "@/services/marketplaceConnectionService";

export function useMarketplaceConnections(): MarketplaceConnectionDetail[] {
  return useSyncExternalStore(
    MarketplaceConnectionService.subscribe,
    MarketplaceConnectionService.getSnapshot,
    MarketplaceConnectionService.getSnapshot,
  );
}

export function useMarketplaceConnection(
  marketplace: MarketplaceName,
): MarketplaceConnectionDetail | undefined {
  const all = useMarketplaceConnections();
  return all.find((c) => c.marketplace === marketplace);
}
