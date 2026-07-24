import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/laporan/")({
  beforeLoad: () => {
    throw redirect({ to: "/laporan/analisa-bisnis" });
  },
});
