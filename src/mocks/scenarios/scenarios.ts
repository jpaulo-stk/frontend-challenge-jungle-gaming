import type { ScenarioId } from "@/mocks/config";

export type ScenarioDefinition = {
  id: ScenarioId;
  label: string;
  description: string;
  /** Latency range in ms applied to every API call. */
  latency: readonly [number, number];
};

const healthy = [60, 180] as const;

export const scenarios: Record<ScenarioId, ScenarioDefinition> = {
  default: {
    id: "default",
    label: "Padrão",
    description: "Tudo saudável.",
    latency: healthy,
  },
  empty: {
    id: "empty",
    label: "Catálogo vazio",
    description: "A listagem de NFTs não retorna resultados.",
    latency: healthy,
  },
  "slow-network": {
    id: "slow-network",
    label: "Rede lenta",
    description: "Latência de 1500–3000 ms em toda chamada (exercita os skeletons).",
    latency: [1500, 3000],
  },
  jitter: {
    id: "jitter",
    label: "Latência variável",
    description: "Latência de 100–2500 ms: respostas chegam fora de ordem.",
    latency: [100, 2500],
  },
  offline: {
    id: "offline",
    label: "Sem conexão",
    description: "Toda chamada falha na rede e o tempo real não conecta.",
    latency: healthy,
  },
  "server-error": {
    id: "server-error",
    label: "Erro intermitente",
    description: "Metade das chamadas responde 500 (sequência determinística pela seed).",
    latency: healthy,
  },
  "session-expired": {
    id: "session-expired",
    label: "Sessão expirada",
    description: "A próxima chamada privada encerra a sessão com 401.",
    latency: healthy,
  },
  "coupon-expired": {
    id: "coupon-expired",
    label: "Cupom expira",
    description: "KURIO10 é aceito uma vez e expira na validação seguinte (checkout).",
    latency: healthy,
  },
  "price-changed": {
    id: "price-changed",
    label: "Preço alterado",
    description:
      "Após a primeira cotação, o preço do primeiro item do carrinho sobe 10% (nft.updated).",
    latency: healthy,
  },
  "sold-out": {
    id: "sold-out",
    label: "Edição esgotada",
    description:
      "Após a primeira cotação, a edição do primeiro item do carrinho esgota (nft.updated).",
    latency: healthy,
  },
  "order-timeout": {
    id: "order-timeout",
    label: "Timeout no pedido",
    description:
      "POST /orders cria o pedido e não responde; repetir com a mesma Idempotency-Key recupera o mesmo pedido.",
    latency: healthy,
  },
  "payment-rejected": {
    id: "payment-rejected",
    label: "Pagamento recusado",
    description: "O pedido vai para rejected via order.updated.",
    latency: healthy,
  },
  "wallet-rejected": {
    id: "wallet-rejected",
    label: "Carteira recusa",
    description: "A conexão com o provedor da carteira é recusada.",
    latency: healthy,
  },
};
