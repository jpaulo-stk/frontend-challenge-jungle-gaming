import type { NftDetail } from "@/features/nft-detail/api/schemas";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";

type NftInfoTabsProps = {
  nft: NftDetail;
};

const networkNames = { ethereum: "Ethereum", polygon: "Polygon", solana: "Solana" } as const;

const shortAddress = (address: string) => `${address.slice(0, 6)}...${address.slice(-4)}`;

/** "Detalhes do NFT" / "Avaliações de colecionadores" tabs. */
export function NftInfoTabs({ nft }: NftInfoTabsProps) {
  return (
    <Tabs defaultValue="details" className="gap-0">
      <TabsList aria-label="Informações do NFT" className="h-auto gap-10 border-b border-border">
        <TabsTrigger value="details" className="h-10 text-lg">
          Detalhes do NFT
        </TabsTrigger>
        <TabsTrigger value="reviews" className="h-10 text-lg font-normal">
          Avaliações de colecionadores ({nft.rating.count})
        </TabsTrigger>
      </TabsList>

      <TabsContent
        value="details"
        className="mt-4 flex flex-col gap-4 text-sm leading-6 text-text-muted"
      >
        {nft.story.map((paragraph) => (
          <p key={paragraph.slice(0, 24)}>{paragraph}</p>
        ))}
        <dl className="flex flex-col gap-4">
          <div>
            <dt className="font-bold text-text">Rede:</dt>
            <dd>
              Cunhado na {networkNames[nft.network]} com procedência imutável e metadados
              armazenados no IPFS.
            </dd>
          </div>
          <div>
            <dt className="font-bold text-text">Contrato:</dt>
            <dd>
              <span title={nft.contractAddress}>{shortAddress(nft.contractAddress)}</span> •
              Contrato inteligente ERC-721 verificado.
            </dd>
          </div>
          <div>
            <dt className="font-bold text-text">Direitos autorais:</dt>
            <dd>
              Direitos autorais do criador: {nft.royaltiesPercent}% nas vendas secundárias, pagos
              automaticamente pelos mercados compatíveis.
            </dd>
          </div>
        </dl>
      </TabsContent>

      <TabsContent value="reviews" className="mt-4 text-sm leading-6 text-text-muted">
        <p className="text-base text-text">
          Nota média {nft.rating.average.toFixed(1).replace(".", ",")} de 5, com base em{" "}
          {nft.rating.count} avaliações de colecionadores.
        </p>
        <p className="mt-2">
          Os comentários individuais das avaliações não fazem parte desta demonstração.
        </p>
      </TabsContent>
    </Tabs>
  );
}
