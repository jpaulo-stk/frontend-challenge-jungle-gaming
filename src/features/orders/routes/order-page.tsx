import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getRouteApi, Link, useNavigate } from "@tanstack/react-router";
import { CircleX, LoaderCircle, RotateCw } from "lucide-react";
import { useEffect } from "react";

import { orderQueryOptions } from "@/features/orders/api/order-api";
import { ReceiptDialog } from "@/features/orders/components/receipt-dialog";
import type { Order } from "@/shared/api/contracts/order";
import { cartKeys } from "@/shared/api/query-keys";
import { useCheckoutDraft } from "@/shared/checkout/checkout-draft";
import { formatEth } from "@/shared/lib/eth";
import { Button, buttonVariants } from "@/shared/ui/button";
import { ErrorState } from "@/shared/ui/error-state";

const routeApi = getRouteApi("/pedido/$orderId");

export function OrderPage() {
  const { orderId } = routeApi.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const order = useQuery(orderQueryOptions(orderId));
  const status = order.data?.status;

  // The order this tab is waiting for settled: a confirmation took the bought
  // units out of the cart (server side), a rejection left the cart as it was.
  useEffect(() => {
    if (!status || status === "pending") return;
    const draft = useCheckoutDraft.getState();
    if (draft.pendingOrderId !== orderId) return;
    if (status === "confirmed") {
      draft.completePurchase();
      void queryClient.invalidateQueries({ queryKey: cartKeys.all });
    } else {
      draft.setPendingOrder(null);
    }
  }, [status, orderId, queryClient]);

  return (
    <div className="page-container pt-6 pb-10 lg:pt-10">
      {order.isError && (
        <ErrorState
          message={order.error.message}
          onRetry={() => void order.refetch()}
          retrying={order.isFetching}
        />
      )}
      {order.data?.status === "pending" && (
        <PendingOrder
          order={order.data}
          refreshing={order.isFetching}
          onRefresh={() => void order.refetch()}
        />
      )}
      {order.data?.status === "rejected" && <RejectedOrder order={order.data} />}
      {order.data?.status === "confirmed" && (
        <>
          <h1 className="sr-only">Pedido confirmado</h1>
          <ReceiptDialog
            order={order.data}
            onClose={() => {
              void navigate({ to: "/" });
            }}
          />
        </>
      )}
    </div>
  );
}

function OrderLines({ order }: { order: Order }) {
  return (
    <div className="w-full max-w-140 text-left">
      <ul className="flex flex-col gap-2">
        {order.lines.map((line) => (
          <li
            key={`${line.nftId}-${line.editionId}`}
            className="flex items-center gap-3 rounded-md bg-surface p-1 pr-3"
          >
            <img
              src={line.image.src}
              alt={line.image.alt}
              width={56}
              height={56}
              className="size-14 shrink-0 rounded-md object-cover"
            />
            <span className="min-w-0 flex-1 truncate font-bold text-text">{line.name}</span>
            <span className="text-sm text-text-muted">
              <span className="sr-only">Quantidade: </span>(x {line.quantity})
            </span>
            <span className="font-bold text-primary-hi">{formatEth(line.lineTotal)}</span>
          </li>
        ))}
      </ul>
      <p className="mt-4 flex justify-between border-t border-border pt-3 font-bold text-text">
        Total <span className="text-primary-hi">{formatEth(order.total)}</span>
      </p>
    </div>
  );
}

type PendingOrderProps = { order: Order; refreshing: boolean; onRefresh: () => void };

/** Processing: polled until the simulation settles it; nothing here claims success. */
function PendingOrder({ order, refreshing, onRefresh }: PendingOrderProps) {
  return (
    <section
      aria-labelledby="order-title"
      className="mx-auto flex max-w-160 flex-col items-center gap-5 text-center"
    >
      <LoaderCircle
        aria-hidden="true"
        className="size-12 animate-spin text-primary motion-reduce:animate-none"
      />
      <h1 id="order-title" className="text-2xl font-bold text-text">
        Processando seu pedido
      </h1>
      <p role="status" className="text-[15px] text-text-muted">
        Aguardando a confirmação da rede. Esta página atualiza sozinha e você pode recarregá-la sem
        perder o pedido.
      </p>
      <Button type="button" variant="outline" disabled={refreshing} onClick={onRefresh}>
        <RotateCw
          aria-hidden="true"
          className={refreshing ? "animate-spin motion-reduce:animate-none" : undefined}
        />
        Atualizar agora
      </Button>
      <OrderLines order={order} />
      <p className="text-xs text-text-dim">Pedido {order.id}</p>
    </section>
  );
}

function RejectedOrder({ order }: { order: Order }) {
  return (
    <section
      aria-labelledby="order-title"
      className="mx-auto flex max-w-160 flex-col items-center gap-5 text-center"
    >
      <CircleX aria-hidden="true" className="size-12 text-danger" />
      <h1 id="order-title" className="text-2xl font-bold text-text">
        Pagamento não concluído
      </h1>
      <div role="alert" className="flex flex-col gap-1 text-[15px]">
        <p className="text-danger">{order.rejectionReason ?? "O pedido foi recusado."}</p>
        <p className="text-text-muted">
          Nenhum valor foi cobrado e seu carrinho continua como estava.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <Link to="/pagamento" className={buttonVariants()}>
          Voltar ao pagamento
        </Link>
        <Link to="/carrinho" className={buttonVariants({ variant: "outline" })}>
          Ir ao carrinho
        </Link>
      </div>
      <OrderLines order={order} />
      <p className="text-xs text-text-dim">Pedido {order.id}</p>
    </section>
  );
}
