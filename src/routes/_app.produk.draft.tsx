import { createFileRoute, Link } from "@tanstack/react-router";
import { ProductTableView } from "@/components/produk/product-table-view";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export const Route = createFileRoute("/_app/produk/draft")({
  head: () => ({ meta: [{ title: "Draft Produk — MAQIL.ERP" }] }),
  component: () => (
    <div className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/produk">Produk</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Draft Produk</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <ProductTableView
        title="Draft Produk"
        description="Produk yang belum dipublikasikan."
        statusFilter="draft"
      />
    </div>
  ),
});
