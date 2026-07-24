import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/gudang/")({
  beforeLoad: () => {
    throw redirect({ to: "/gudang/penambahan-stok" });
  },
});
