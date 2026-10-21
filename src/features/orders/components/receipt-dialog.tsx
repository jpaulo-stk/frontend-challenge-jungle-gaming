import { ExternalLink } from "lucide-react";

import { ThankYouIcon } from "@/features/orders/components/thank-you-icon";
import type { Order } from "@/shared/api/contracts/order";
import { compareEth, formatEth } from "@/shared/lib/eth";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/shared/ui/dialog";

const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const networkNames = { ethereum: "Ethereum", polygon: "Polygon", solana: "Solana" } as const;

/** "2026-07-29T…" → "29 Jul, 2026", as in the receipt frame. */
function receiptDate(iso: string): string {
  const date = new Date(iso);
  return `${String(date.getDate())} ${months[date.getMonth()] ?? ""}, ${String(date.getFullYear())}`;
}

const shortHash = (hash: string) =>
  `${hash.slice(0, 6).toUpperCase().replace("0X", "0x")}…${hash.slice(-4).toUpperCase()}`;

type ReceiptDialogProps = {
  order: Order;
  onClose: () => void;
};

/**
 * Receipt of a confirmed order: a modal on desktop, full screen on mobile.
 * Every value is the order's frozen copy, never the current catalog.
 */
export function ReceiptDialog({ order, onClose }: ReceiptDialogProps) {
  const hash = order.transactionHash;

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        aria-describedby="receipt-summary"
        className="max-h-dvh gap-0 overflow-y-auto border-0 bg-surface p-0 text-text max-md:inset-0 max-md:h-dvh max-md:max-w-none max-md:translate-0 max-md:rounded-none sm:max-w-144.5 md:rounded-none"
      >
        <div className="flex flex-col items-center gap-5 px-6 pt-6 pb-5">
          <ThankYouIcon className="h-20 w-16.5 text-primary" />
          <DialogTitle className="text-center text-base font-bold text-primary-hi">
            Seus NFTs agora estão na sua carteira
          </DialogTitle>
        </div>

        <dl
          id="receipt-summary"
          className="grid grid-cols-2 gap-y-3 border-y border-primary px-6 py-3 text-sm md:flex md:justify-between md:gap-0"
        >
          <div className="md:border-r md:border-primary md:pr-4">
            <dt className="font-bold text-text-muted">ID da transação</dt>
            <dd className="text-text-muted" title={hash ?? undefined}>
              {hash ? shortHash(hash) : "—"}
            </dd>
          </div>
          <div className="md:border-r md:border-primary md:px-4">
            <dt className="text-text-muted">Data</dt>
            <dd className="text-text-muted">
              <time dateTime={order.updatedAt}>{receiptDate(order.updatedAt)}</time>
            </dd>
          </div>
          <div className="md:border-r md:border-primary md:px-4">
            <dt className="text-text-muted">Total</dt>
            <dd className="text-text-muted">{formatEth(order.total)}</dd>
          </div>
          <div className="md:pl-4">
            <dt className="font-bold text-text-muted">Carteira</dt>
            <dd className="text-text-muted">{order.wallet.label}</dd>
          </div>
        </dl>

        <section aria-labelledby="receipt-details" className="px-6 pt-6 pb-8 md:px-11">
          <h3 id="receipt-details" className="text-[15px] font-bold">
            Detalhes da transação
          </h3>
          <table className="mt-2 w-full text-left">
            <thead>
              <tr className="border-b border-border text-[15px] font-bold">
                <th scope="col" className="pb-2">
                  NFTs
                </th>
                <th scope="col" className="pb-2 text-center">
                  Edições
                </th>
                <th scope="col" className="pb-2 text-right">
                  Subtotal
                </th>
              </tr>
            </thead>
            <tbody>
              {order.lines.map((line) => (
                <tr key={`${line.nftId}-${line.editionId}`}>
                  <td className="pt-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={line.image.src}
                        alt={line.image.alt}
                        width={70}
                        height={70}
                        className="size-14 shrink-0 rounded-md object-cover md:size-17.5"
                      />
                      <div className="min-w-0">
                        <p className="text-[15px] font-bold">{line.name}</p>
                        <p className="text-sm text-text-muted">ID do token: {line.tokenId}</p>
                      </div>
                    </div>
                  </td>
                  <td className="pt-3 text-center text-sm text-text-muted">
                    <span className="sr-only">Quantidade: </span>(x {line.quantity})
                  </td>
                  <td className="pt-3 text-right text-lg font-bold whitespace-nowrap text-primary-hi">
                    {formatEth(line.lineTotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <dl className="mt-4 flex flex-col gap-1 border-b border-border pb-2 text-[15px] md:pl-42.5">
            {compareEth(order.discount, "0") > 0 && (
              <div className="flex justify-between">
                <dt>Desconto{order.coupon ? ` (${order.coupon.code})` : ""}</dt>
                <dd>(-) {formatEth(order.discount)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt>Taxa de rede</dt>
              <dd className="text-base">{formatEth(order.networkFee)}</dd>
            </div>
            <div className="flex justify-between font-bold">
              <dt>Total</dt>
              <dd className="text-lg text-primary-hi">{formatEth(order.total)}</dd>
            </div>
          </dl>

          <DialogDescription className="mt-4 text-center text-sm leading-6 text-text-muted">
            Transação confirmada na {networkNames[order.network]}. A propriedade foi transferida
            para sua carteira conectada e registrada na rede.
          </DialogDescription>

          {order.explorerUrl && (
            <div className="mt-5 flex flex-col items-center gap-2">
              <a
                href={order.explorerUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex h-12 items-center gap-2 rounded-md bg-primary px-4 font-bold text-bg hover:bg-primary-hi"
              >
                Ver no Etherscan
                <ExternalLink aria-hidden="true" className="size-4" />
                <span className="sr-only">(simulado, abre em nova aba)</span>
              </a>
              <p className="text-xs text-text-dim">
                Link simulado: esta transação não existe em uma rede real.
              </p>
            </div>
          )}
        </section>
        <div aria-hidden="true" className="h-2.5 bg-primary" />
      </DialogContent>
    </Dialog>
  );
}
