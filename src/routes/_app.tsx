import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { AppFooter } from "@/components/layout/app-footer";

export const Route = createFileRoute("/_app")({
  beforeLoad: ({ location }) => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem("maqil.auth.session");
    let ok = false;
    try {
      const parsed = raw ? JSON.parse(raw) : null;
      ok = !!(parsed && parsed.isLoggedIn && parsed.role);
    } catch {
      ok = false;
    }
    if (!ok) {
      throw redirect({
        to: "/login",
        search: { redirect: location.href },
      });
    }
  },
  component: AppLayout,
});

function AppLayout() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-muted/30">
        <AppSidebar />
        <SidebarInset className="flex min-h-screen flex-1 flex-col">
          <AppHeader />
          <main className="flex-1 p-4 sm:p-6">
            <Outlet />
          </main>
          <AppFooter />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
