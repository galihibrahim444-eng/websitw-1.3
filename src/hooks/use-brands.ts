import { useEffect, useState } from "react";
import { BrandService, type ShopeeBrand } from "@/services/brandService";

/**
 * Memuat daftar brand yang sesuai dengan kategori terpilih.
 * Mengembalikan array kosong bila kategori belum dipilih.
 */
export function useBrands(
  categoryPath: { id: number | string; name: string }[],
) {
  const [brands, setBrands] = useState<ShopeeBrand[]>([]);
  const [loading, setLoading] = useState(false);

  const key = categoryPath.map((p) => p.id).join("/");

  useEffect(() => {
    let cancelled = false;
    if (!categoryPath.length) {
      setBrands([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    BrandService.getBrandsForCategory(categoryPath)
      .then((data) => {
        if (!cancelled) setBrands(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return { brands, loading };
}
