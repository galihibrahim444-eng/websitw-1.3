import { useEffect, useState } from "react";
import { CategoryService, type CategoryOption } from "@/services/categoryService";

/** Memuat daftar leaf kategori dari CategoryService (dummy → Shopee API). */
export function useCategoryOptions() {
  const [options, setOptions] = useState<CategoryOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    CategoryService.getCategoryOptions()
      .then((data) => {
        if (!cancelled) setOptions(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { options, loading };
}
