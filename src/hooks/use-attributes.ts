import { useEffect, useState } from "react";
import {
  AttributeService,
  type ShopeeAttribute,
} from "@/services/attributeService";

/**
 * Memuat daftar atribut untuk kategori terpilih.
 * Otomatis refetch ketika breadcrumb kategori berubah.
 */
export function useAttributes(
  categoryPath: { id: number | string; name: string }[],
) {
  const [attributes, setAttributes] = useState<ShopeeAttribute[]>([]);
  const [loading, setLoading] = useState(false);

  const key = categoryPath.map((p) => p.id).join("/");

  useEffect(() => {
    let cancelled = false;
    if (!categoryPath.length) {
      setAttributes([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    AttributeService.getAttributesForCategory(categoryPath)
      .then((data) => {
        if (!cancelled) setAttributes(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return { attributes, loading };
}
