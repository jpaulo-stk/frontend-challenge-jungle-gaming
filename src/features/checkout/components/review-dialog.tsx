import { LoaderCircle, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";

import type { Review } from "@/features/checkout/hooks/use-checkout-submit";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { OrderTotals } from "@/shared/ui/order-totals";

type ReviewDialogProps = {
  review: Review | null;
  busy: boolean;
  onAccept: () => void;
  onClose: () => void;
  children?: ReactNode;
};

/**
 * Shown when the quote asked right before sending differs from what was on
 * screen. Nothing was sent; the collector confirms the new values or goes back.
 */
export function ReviewDialog({ review, busy, onAccept, onClose, children }: ReviewDialogProps) {
  return (
    <Dialog
      open={review !== null}
      onOpenChange={(open) => {
        if (!open && !busy) onClose();
      }}
    >
      {review && (
        <DialogContent className="sm:max-w-140">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TriangleAlert aria-hidden="true" className="size-5 text-primary-hi" />
              {review.blocked ? "Há itens indisponíveis" : "Os valores mudaram"}
            </DialogTitle>
            <DialogDescription>
              Nada foi enviado. Confira o que mudou desde que você revisou o pedido.
            </DialogDescription>
          </DialogHeader>
          <ul className="flex list-disc flex-col gap-1 pl-5 text-[15px] text-text">
            {review.changes.map((change) => (
              <li key={change}>{change}</li>
            ))}
          </ul>
          <OrderTotals
            subtotal={review.quote.subtotal}
            discount={review.quote.discount}
            networkFee={review.quote.networkFee}
            total={review.quote.total}
          />
          {review.blocked && (
            <p className="text-sm text-danger">
              Deixe os itens indisponíveis para depois, ou ajuste-os no carrinho, para continuar.
            </p>
          )}
          {children}
          <DialogFooter>
            <Button type="button" variant="outline" disabled={busy} onClick={onClose}>
              Voltar ao resumo
            </Button>
            {!review.blocked && (
              <Button type="button" disabled={busy} onClick={onAccept}>
                {busy && (
                  <LoaderCircle
                    aria-hidden="true"
                    className="animate-spin motion-reduce:animate-none"
                  />
                )}
                Confirmar com os novos valores
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      )}
    </Dialog>
  );
}
