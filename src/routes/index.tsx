import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    if (typeof window !== "undefined") {
      const raw = window.localStorage.getItem("maqil.auth.session");
      let ok = false;
      try {
        const parsed = raw ? JSON.parse(raw) : null;
        ok = !!(parsed && parsed.isLoggedIn && parsed.role);
      } catch {
        ok = false;
      }
      if (!ok) throw redirect({ to: "/login" });
    }
    throw redirect({ to: "/dashboard" });
  },
});
