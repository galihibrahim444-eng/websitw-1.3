import { useEffect, useState } from "react";
import {
  MarketplaceAccountService,
  type MarketplaceConnection,
  type MarketplaceName,
} from "@/services/marketplaceAccountService";

interface UseConnectedMarketplacesResult {
  connections: MarketplaceConnection[];
  connectedMarketplaces: MarketplaceName[];
  loading: boolean;
  error: Error | null;
}

/**
 * Hook untuk memperoleh daftar marketplace beserta status koneksinya.
 * Komponen UI cukup memakai `connectedMarketplaces` untuk merender tab
 * dinamis tanpa perlu tahu sumber datanya.
 */
export function useConnectedMarketplaces(): UseConnectedMarketplacesResult {
  const [connections, setConnections] = useState<MarketplaceConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    MarketplaceAccountService.getConnectedMarketplaces()
      .then((data) => {
        if (cancelled) return;
        setConnections(data);
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err : new Error(String(err)));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return {
    connections,
    connectedMarketplaces: connections
      .filter((c) => c.connected)
      .map((c) => c.marketplace),
    loading,
    error,
  };
}
