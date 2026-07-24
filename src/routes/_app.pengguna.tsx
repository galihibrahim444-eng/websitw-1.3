import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/page-header";
import { PlaceholderTable } from "@/components/common/placeholder-table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/_app/pengguna")({
  head: () => ({ meta: [{ title: "Pengguna — MAQIL.ERP" }] }),
  component: () => (
    <div className="space-y-6">
      <PageHeader
        title="Pengguna"
        description="Kelola pengguna internal (maks. 4 pengguna)."
        actions={
          <Button size="sm">
            <Plus className="h-4 w-4" />
            Undang Pengguna
          </Button>
        }
      />
      <PlaceholderTable columns={["Nama", "Email", "Role", "Terakhir Aktif", "Status"]} rows={4} />
    </div>
  ),
});
