import { Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { Card } from "@/components/ui/card";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export type Crumb = { label: string; href?: string };

export function PlaceholderPage({
  title,
  description,
  breadcrumbs,
  note,
}: {
  title: string;
  description?: string;
  breadcrumbs: Crumb[];
  note?: string;
}) {
  return (
    <div className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          {breadcrumbs.map((c, i) => {
            const last = i === breadcrumbs.length - 1;
            return (
              <span key={`${c.label}-${i}`} className="contents">
                <BreadcrumbItem>
                  {last || !c.href ? (
                    <BreadcrumbPage>{c.label}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild>
                      <Link to={c.href}>{c.label}</Link>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
                {!last && <BreadcrumbSeparator />}
              </span>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>

      <PageHeader title={title} description={description} />

      <Card className="grid place-items-center gap-3 p-14 text-center">
        <div className="grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
          <Sparkles className="h-6 w-6" />
        </div>
        <div>
          <p className="text-base font-medium text-foreground">Coming Soon</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {note ?? "Halaman ini sedang dalam pengembangan."}
          </p>
        </div>
      </Card>
    </div>
  );
}
