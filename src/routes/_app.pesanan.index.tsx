import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/pesanan/")({
  beforeLoad: () => {
    throw redirect({ to: "/pesanan/menunggu-diproses" });
  },
});
