import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { LogOut, Mail, Shield, User as UserIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/common/page-header";
import { useAuth } from "@/lib/auth-store";

export const Route = createFileRoute("/_app/profile")({
  head: () => ({
    meta: [
      { title: "Profil — MAQIL.ERP" },
      { name: "description", content: "Profil pengguna MAQIL.ERP." },
    ],
  }),
  component: ProfilePage,
});

function initials(name: string) {
  return name
    .split(" ")
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const ROLE_LABEL: Record<string, string> = {
  owner: "Owner",
  admin: "Admin",
  warehouse: "Gudang",
  "customer-service": "Customer Service",
  viewer: "Viewer",
};

function ProfilePage() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  if (!currentUser) return null;

  const handleLogout = () => {
    logout();
    navigate({ to: "/login", replace: true });
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <PageHeader title="Profil" description="Informasi akun Anda." />

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-primary text-lg font-semibold text-primary-foreground">
                {initials(currentUser.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="truncate text-lg font-semibold">{currentUser.name}</div>
              <div className="truncate text-sm text-muted-foreground">
                {currentUser.email}
              </div>
              <Badge variant="secondary" className="mt-2">
                {ROLE_LABEL[currentUser.role] ?? currentUser.role}
              </Badge>
            </div>
          </div>

          <Separator className="my-6" />

          <div className="space-y-4 text-sm">
            <Row icon={<UserIcon className="h-4 w-4" />} label="Nama" value={currentUser.name} />
            <Row icon={<Mail className="h-4 w-4" />} label="Email" value={currentUser.email} />
            <Row
              icon={<Shield className="h-4 w-4" />}
              label="Role"
              value={ROLE_LABEL[currentUser.role] ?? currentUser.role}
            />
          </div>

          <Separator className="my-6" />

          <Button variant="destructive" onClick={handleLogout} className="w-full sm:w-auto">
            <LogOut className="mr-2 h-4 w-4" />
            Keluar
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 text-muted-foreground">{icon}</div>
      <div className="flex-1">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className="font-medium">{value}</div>
      </div>
    </div>
  );
}
