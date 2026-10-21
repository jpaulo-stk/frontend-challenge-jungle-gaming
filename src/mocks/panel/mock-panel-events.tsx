import { useState } from "react";

import { mockControls } from "@/mocks/controls";
import { getDb } from "@/mocks/db/store";
import { Button } from "@/shared/ui/button";
import { Label } from "@/shared/ui/label";

const selectClassName =
  "h-10 w-full rounded-md border-[1.5px] border-border bg-surface px-3 text-sm text-text";

export function MockPanelEvents() {
  const nfts = getDb().nfts;
  const [nftId, setNftId] = useState(nfts[0]?.id ?? "");
  const [status, setStatus] = useState("");
  const [, refresh] = useState(0);
  const nft = nfts.find((candidate) => candidate.id === nftId);
  const pending = mockControls.pendingOrders();

  const run = (message: string, action: () => unknown) => {
    void Promise.resolve(action()).then(() => {
      setStatus(message);
      refresh((count) => count + 1);
    });
  };

  return (
    <div className="flex flex-col gap-3 border-t border-border px-4 pt-4 pb-6">
      <Label htmlFor="mock-nft">NFT para eventos</Label>
      <select
        id="mock-nft"
        className={selectClassName}
        value={nftId}
        onChange={(event) => {
          setNftId(event.target.value);
        }}
      >
        {nfts.map((candidate) => (
          <option key={candidate.id} value={candidate.id}>
            {candidate.name} — {candidate.price} ETH (v{candidate.version})
          </option>
        ))}
      </select>
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            run("Preço +10% enviado (nft.updated).", () => {
              mockControls.raiseNftPrice(nftId);
            });
          }}
        >
          Subir preço 10%
        </Button>
        {nft?.editions.map((edition) => (
          <Button
            key={edition.id}
            size="sm"
            variant="outline"
            disabled={edition.available === 0}
            onClick={() => {
              run(`Edição ${edition.label} esgotada.`, () => {
                mockControls.setEditionAvailability(nftId, edition.id, 0);
              });
            }}
          >
            Esgotar {edition.label}
          </Button>
        ))}
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            run("Último evento reenviado.", () => {
              mockControls.replayLastEvent();
            });
          }}
        >
          Repetir último evento
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            run("Evento com versão antiga enviado.", () => {
              mockControls.sendStaleNftEvent(nftId);
            });
          }}
        >
          Enviar evento antigo
        </Button>
      </div>

      <p className="mt-2 text-sm font-bold text-text">Pedidos pendentes</p>
      {pending.length === 0 && <p className="text-xs text-text-muted">Nenhum pedido pendente.</p>}
      {pending.map((orderId) => (
        <div key={orderId} className="flex items-center gap-2">
          <span className="flex-1 truncate text-xs text-text-muted">{orderId}</span>
          <Button
            size="sm"
            onClick={() => {
              run("Pedido confirmado.", () => mockControls.settleOrder(orderId, "confirmed"));
            }}
          >
            Confirmar
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => {
              run("Pedido recusado.", () => mockControls.settleOrder(orderId, "rejected"));
            }}
          >
            Recusar
          </Button>
        </div>
      ))}

      <p className="mt-2 text-sm font-bold text-text">Conexão e sessão</p>
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            run("Conexão de tempo real derrubada.", () => mockControls.dropConnections());
          }}
        >
          Derrubar conexão
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            run("A próxima chamada privada expira a sessão.", () => {
              mockControls.expireSessionOnNextRequest();
            });
          }}
        >
          Expirar sessão
        </Button>
      </div>

      <p role="status" className="min-h-5 text-xs text-primary-hi">
        {status}
      </p>
    </div>
  );
}
