import { useState } from "react";
import { ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * ProductCell — reusable cell for product tables across the ERP.
 * Layout:
 *   [ 48x48 image ]  Product Name
 *                    Master SKU
 *
 * Future-ready: accepts image_url, product_name, master_sku, status,
 * marketplace_count without UI redesign.
 */
export type ProductCellProps = {
  productName: string;
  masterSku: string;
  imageUrl?: string | null;
  status?: string;
  marketplaceCount?: number;
  className?: string;
  nameClassName?: string;
};

export function ProductCell({
  productName,
  masterSku,
  imageUrl,
  status,
  marketplaceCount,
  className,
  nameClassName,
}: ProductCellProps) {
  const [errored, setErrored] = useState(false);
  const showImage = !!imageUrl && !errored;

  return (
    <div className={cn("flex items-center gap-3 min-w-0", className)}>
      <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-md border bg-muted">
        {showImage ? (
          <img
            src={imageUrl!}
            alt={productName}
            loading="lazy"
            onError={() => setErrored(true)}
            className="h-full w-full object-cover"
          />
        ) : (
          <ImageIcon className="h-5 w-5 text-muted-foreground/70" />
        )}
      </div>
      <div className="min-w-0">
        <p
          className={cn(
            "truncate text-sm font-medium text-foreground max-w-[280px]",
            nameClassName,
          )}
          title={productName}
        >
          {productName}
        </p>
        <div className="mt-0.5 flex items-center gap-2">
          <p className="truncate font-mono text-xs text-muted-foreground">
            {masterSku}
          </p>
          {typeof marketplaceCount === "number" && (
            <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
              {marketplaceCount} toko
            </span>
          )}
          {status && (
            <span className="text-[10px] font-medium text-muted-foreground">
              · {status}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
