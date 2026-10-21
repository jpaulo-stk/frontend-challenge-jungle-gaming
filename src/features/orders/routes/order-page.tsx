import { getRouteApi } from "@tanstack/react-router";

import { PageShell } from "@/shared/ui/page-shell";

const routeApi = getRouteApi("/pedido/$orderId");

export function OrderPage() {
  const { orderId } = routeApi.useParams();
  return <PageShell title={`Pedido ${orderId}`} />;
}
