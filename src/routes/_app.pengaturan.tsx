import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export const Route = createFileRoute("/_app/pengaturan")({
  head: () => ({ meta: [{ title: "Pengaturan — MAQIL.ERP" }] }),
  component: () => (
    <div className="space-y-6">
      <PageHeader title="Pengaturan" description="Konfigurasi umum aplikasi." />
      <Card>
        <CardContent className="p-6 space-y-6">
          <div>
            <h2 className="text-base font-semibold">Perusahaan</h2>
            <p className="text-sm text-muted-foreground">Informasi dasar perusahaan.</p>
          </div>
          <Separator />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="company">Nama Perusahaan</Label>
              <Input id="company" placeholder="MAQIL" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Kontak</Label>
              <Input id="email" type="email" placeholder="info@maqil.com" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="address">Alamat</Label>
              <Input id="address" placeholder="Alamat kantor" />
            </div>
          </div>
          <div className="flex justify-end">
            <Button>Simpan Perubahan</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  ),
});
