# Kurio — Marketplace de NFTs

Front-end do marketplace de NFTs Kurio em React + TypeScript. API, sessão, carteiras, pagamento e tempo real são simulados na camada de rede com MSW e Socket.IO, então a aplicação roda inteira a partir de um checkout limpo, sem backend.

Decisões de arquitetura, contratos e estratégia de cache estão em [ARCHITECTURE.md](./ARCHITECTURE.md).

## Requisitos

- Node.js 22 (veja `.nvmrc`; mínimo 22.12)
- pnpm 10.34.7, fixado no campo `packageManager`. Com o corepack ativo (`corepack enable`), a versão certa é usada automaticamente.

## Setup

```bash
pnpm install
pnpm exec playwright install chromium   # apenas para rodar os testes E2E
pnpm dev                                # http://localhost:5173
```

## Variáveis de ambiente

| Variável            | Padrão                      | Uso                                                                  |
| ------------------- | --------------------------- | -------------------------------------------------------------------- |
| `VITE_ENABLE_MOCKS` | `true` (em `.env`)          | Liga a API simulada (MSW + Socket.IO), inclusive no build publicado. |
| `VITE_REALTIME_URL` | `wss://realtime.kurio.test` | Origem do servidor Socket.IO. Com mocks, esse host é interceptado.   |

## Credenciais fictícias

| Colecionador       | E-mail                    | Senha      | Dados de exemplo                                                          |
| ------------------ | ------------------------- | ---------- | ------------------------------------------------------------------------- |
| Colecionador Kurio | `colecionador@kurio.test` | `kurio123` | Carrinho do Figma (26.846 ETH), 2 favoritos, carteira principal, 1 pedido |
| Nova Sato          | `nova.sato@kurio.test`    | `kurio123` | 1 item no carrinho, 3 favoritos, carteiras principal e reserva            |

Senhas novas precisam de pelo menos 8 caracteres. Os botões "Continuar com Google/Facebook" e "Esqueceu a senha?" estão fora do escopo da demonstração e avisam isso ao serem acionados.

Cupons: `KURIO10` (10% de desconto), `EXPIRADO2025` (expirado); qualquer outro código é inválido.

## Cenários da API simulada

O cenário é escolhido pela URL (`?scenario=<id>`) ou pelo painel de simulação (botão com ícone de frasco no canto inferior esquerdo; no build publicado, abra com `?painel=1`). Trocar de cenário **restaura os dados** a partir das fixtures. A escolha fica salva no navegador.

| Cenário            | O que acontece                                                                                  | Como reproduzir                                       |
| ------------------ | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `default`          | Tudo saudável.                                                                                  | `/?scenario=default`                                  |
| `empty`            | O catálogo não retorna resultados.                                                              | `/?scenario=empty`                                    |
| `slow-network`     | Latência de 1500–3000 ms em toda chamada (skeletons).                                           | `/?scenario=slow-network`                             |
| `jitter`           | Latência de 100–2500 ms: respostas chegam fora de ordem.                                        | `/?scenario=jitter` e digite rápido na busca          |
| `offline`          | Toda chamada falha na rede; o tempo real não conecta.                                           | `/?scenario=offline`                                  |
| `server-error`     | Metade das chamadas responde 500, em sequência determinística pela seed.                        | `/?scenario=server-error`                             |
| `session-expired`  | A próxima chamada privada encerra a sessão (401).                                               | Entre, depois abra perfil, favoritos ou pagamento     |
| `coupon-expired`   | `KURIO10` é aceito uma vez e expira na validação seguinte (checkout).                           | Aplique `KURIO10` no carrinho e siga para o pagamento |
| `price-changed`    | Depois da primeira cotação, o preço do primeiro item do carrinho sobe 10% (`nft.updated`).      | Entre, abra o carrinho e aguarde ~3 s                 |
| `sold-out`         | Depois da primeira cotação, a edição do primeiro item do carrinho esgota (`nft.updated`).       | Entre, abra o carrinho e aguarde ~3 s                 |
| `order-timeout`    | `POST /orders` cria o pedido e não responde; repetir com a mesma chave recupera o mesmo pedido. | Confirme a compra e aguarde o timeout                 |
| `payment-rejected` | O pedido vai para `rejected` via `order.updated`.                                               | Confirme a compra                                     |
| `wallet-rejected`  | A conexão com a carteira é recusada.                                                            | Conecte uma carteira no pagamento                     |

Parâmetros adicionais (também lidos da URL e salvos):

| Parâmetro          | Efeito                                                            |
| ------------------ | ----------------------------------------------------------------- |
| `reset=1`          | Restaura os dados do cenário atual.                               |
| `seed=<n>`         | Seed do gerador pseudoaleatório (latência e falhas). Padrão 42.   |
| `latency=<ms>`     | Latência fixa, sobrepondo a do cenário (os testes usam `0`).      |
| `settle=manual`    | Pedidos ficam `pending` até serem liquidados pelo painel.         |
| `settleDelay=<ms>` | Tempo até a liquidação automática do pedido (padrão 2500).        |
| `eventDelay=<ms>`  | Atraso dos eventos de `price-changed` e `sold-out` (padrão 3000). |
| `painel=1`         | Mostra o painel de simulação fora do ambiente de desenvolvimento. |

O painel também dispara eventos manualmente: subir preço, esgotar edição, repetir o último evento, enviar um evento antigo, confirmar ou recusar pedido pendente, derrubar a conexão e expirar a sessão.

### Limitações das fixtures

- São 36 NFTs em 9 coleções e 3 redes, com preços de 0.02 a 12.30 ETH.
- O Figma tem só 4 artes. As fixtures as reutilizam com nomes diferentes, como o próprio layout faz, e a galeria do detalhe repete a arte principal nas 4 miniaturas.
- Nomes e preços que aparecem no Figma foram mantidos. Os demais seguem o mesmo vocabulário.
- As contagens da barra lateral vêm dos dados reais (36 NFTs), não dos números ilustrativos do Figma.

## Comandos

| Comando                   | O que faz                                              |
| ------------------------- | ------------------------------------------------------ |
| `pnpm dev`                | Servidor de desenvolvimento                            |
| `pnpm build`              | Verificação de tipos + build de produção em `dist/`    |
| `pnpm preview`            | Serve o build de produção (http://localhost:4173)      |
| `pnpm typecheck`          | Verificação de tipos (`tsc -b`)                        |
| `pnpm lint`               | ESLint, incluindo as fronteiras entre features         |
| `pnpm format`             | Prettier                                               |
| `pnpm test:e2e`           | Testes Playwright (Chromium desktop 1440 e mobile 390) |
| `pnpm test:e2e:ui`        | Playwright em modo interativo                          |
| `pnpm test:visual:update` | Regera as baselines de regressão visual                |
| `pnpm lighthouse`         | Auditoria Lighthouse (3 medições, mediana)             |

O relatório HTML do Playwright fica em `playwright-report/`, e os traces das falhas em `test-results/`.

Com `pnpm dev` rodando, `http://localhost:5173/__ui` mostra o catálogo de componentes do design system. A rota só existe em desenvolvimento.

## Versões instaladas

| Ferramenta                           | Versão   |
| ------------------------------------ | -------- |
| Node.js (máquina de desenvolvimento) | 22.14.0  |
| pnpm                                 | 10.34.7  |
| Vite                                 | 8.3.4    |
| TypeScript                           | 6.0.3    |
| React                                | 19.3.1   |
| TanStack Router                      | 1.170.45 |
| TanStack Query                       | 5.104.5  |
| Axios                                | 1.20.0   |
| zod                                  | 4.6.7    |
| socket.io-client                     | 4.8.4    |
| Tailwind CSS                         | 4.3.3    |
| MSW                                  | 2.15.0   |
| @mswjs/socket.io-binding             | 0.2.0    |
| Playwright                           | 1.64.1   |
| ESLint                               | 10.13.0  |
