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

export const Route = createFileRoute("/_app/produk/arsip")({
  head: () => ({ meta: [{ title: "Arsip Produk — MAQIL.ERP" }] }),
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
            <BreadcrumbPage>Arsip Produk</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <ProductTableView
        title="Arsip Produk"
        description="Produk yang telah diarsipkan."
        statusFilter="archive"
      />
    </div>
  ),
});
