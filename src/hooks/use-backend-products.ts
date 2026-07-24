import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { StoredProduct, StoredVariant } from "@/lib/product-store";

interface BackendProduct {
  id: string;
  productCode: string;
  parentSku: string;
  sku: string;
  name: string;
  hpp?: number;
  sellingPrice: number;
  stock: number;
  reservedStock: number;
  weight: number;
  category: string;
  status: string;
  marketplace: string;
  images: string[];
  variants?: Array<{
    sku: string;
    hpp?: number;
    sellingPrice: number;
    stock: number;
    reservedStock?: number;
    image?: string | null;
    active: boolean;
  }>;
  createdAt: string;
  updatedAt: string;
}

const STATUS_MAP: Record<string, StoredProduct["status"]> = {
  ACTIVE: "live",
  DRAFT: "draft",
  ARCHIVED: "archive",
};

function mapBackendProduct(product: BackendProduct): StoredProduct {
  const variants: StoredVariant[] = (product.variants ?? []).map((v) => ({
    sku: v.sku,
    harga: v.sellingPrice,
    stok: v.stock,
    gambar: v.image ?? null,
    status: v.active,
  }));

  if (variants.length === 0) {
    variants.push({
      sku: product.sku,
      harga: product.sellingPrice,
      stok: product.stock,
      gambar: product.images[0] ?? null,
      status: true,
    });
  }

  return {
    id: product.id,
    namaProduk: product.name,
    skuInduk: product.parentSku || product.sku || product.productCode,
    kategori: product.category ?? "",
    brand: "",
    fotoCover: product.images[0] ?? null,
    harga: product.sellingPrice,
    hpp: product.hpp,
    sellingPrice: product.sellingPrice,
    stok: product.stock,
    minimumStock: undefined,
    marketplace: product.marketplace ?? "",
    status: STATUS_MAP[product.status] ?? "draft",
    createdAt: Date.parse(product.createdAt) || Date.now(),
    updatedAt: Date.parse(product.updatedAt) || Date.now(),
    variants,
  };
}

export function useBackendProducts(): StoredProduct[] | null {
  const [products, setProducts] = useState<StoredProduct[] | null>(null);

  useEffect(() => {
    let active = true;

    apiFetch<{ data: BackendProduct[]; total: number; page: number; limit: number; totalPages: number }>(
      "/products",
      {
        params: { limit: 1000 },
      },
    )
      .then((response) => {
        if (!active) return;
        setProducts(response.data.map(mapBackendProduct));
      })
      .catch(() => {
        if (!active) return;
        setProducts([]);
      });

    return () => {
      active = false;
    };
  }, []);

  return products;
}
