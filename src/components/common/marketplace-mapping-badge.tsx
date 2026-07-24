import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type MarketplaceMappingBadgeProps = {
  connected: boolean;
  totalMarketplace: number;
  totalSku: number;
  marketplaces?: string[];
  onClick?: () => void;
};

export function MarketplaceMappingBadge({
  connected,
  totalMarketplace,
  totalSku,
  marketplaces = [],
  onClick,
}: MarketplaceMappingBadgeProps) {
  if (connected) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="secondary"
            className="cursor-pointer"
            role="button"
            aria-label={`Terhubung dengan ${totalMarketplace} marketplace untuk ${totalSku} SKU`}
            onClick={onClick}
          >
            <div className="flex flex-col items-start gap-0.5 text-left">
              <span className="text-sm">✅ Terhubung</span>
              <span className="text-[10px] leading-none text-muted-foreground">
                {totalMarketplace} Marketplace • {totalSku} SKU
              </span>
            </div>
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          {marketplaces.length > 0 ? (
            <div className="space-y-1 text-left">
              {marketplaces.map((marketplace) => (
                <div key={marketplace}>{marketplace}</div>
              ))}
            </div>
          ) : (
            <div>Belum ada marketplace yang terhubung.</div>
          )}
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Button variant="outline" size="sm" onClick={onClick}>
      Hubungkan
    </Button>
  );
}
