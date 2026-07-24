import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

export interface BackendStockProduct {
  id: string;
  productCode: string;
  name: string;
  status: string;
}

export interface BackendWarehouse {
  id: string;
  name: string;
  code: string;
  type: string;
  isActive: boolean;
}

export interface BackendStock {
  id: string;
  productId: string;
  warehouseId: string;
  qty: number;
  minimumStock: number;
  createdAt: string;
  updatedAt: string;
  product: BackendStockProduct;
  warehouse: BackendWarehouse;
}

interface BackendStockListResponse {
  data: BackendStock[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function useBackendStocks() {
  const [stocks, setStocks] = useState<BackendStock[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStocks = () => {
    setLoading(true);
    setError(null);

    apiFetch<BackendStockListResponse>("/stocks", {
      params: { limit: 1000 },
    })
      .then((response) => {
        setStocks(response.data);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : String(err));
        setStocks([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadStocks();
  }, []);

  return {
    stocks,
    loading,
    error,
    reload: loadStocks,
  };
}
