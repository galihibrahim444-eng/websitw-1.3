import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/marketplace-mapping/")({
  beforeLoad: () => {
    throw redirect({ to: "/marketplace-mapping/shopee" });
  },
});
