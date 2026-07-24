import { useEffect, useState } from "react";
import {
  MarketplaceAccountService,
  type MarketplaceAccount,
  type MarketplaceName,
} from "@/services/marketplaceAccountService";

interface UseMarketplaceShopsResult {
  shops: MarketplaceAccount[];
  loading: boolean;
  error: Error | null;
}

/**
 * Hook tipis di atas MarketplaceAccountService. Komponen UI cukup memanggil
 * hook ini tanpa perlu tahu sumber datanya (dummy, DB, atau API marketplace).
 */
export function useMarketplaceShops(
  marketplace: MarketplaceName,
): UseMarketplaceShopsResult {
  const [shops, setShops] = useState<MarketplaceAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    MarketplaceAccountService.getConnectedShops(marketplace)
      .then((data) => {
        if (cancelled) return;
        setShops(data);
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
  }, [marketplace]);

  return { shops, loading, error };
}
