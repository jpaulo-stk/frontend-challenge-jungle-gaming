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

### Fluxo de compra

1. Entre como `colecionador@kurio.test` e abra o carrinho: o total é 26.846 ETH, como no Figma.
2. Em "Conectar e finalizar", o formulário vem preenchido com a carteira cadastrada. Conecte a carteira e confirme.
3. O pedido fica em processamento por ~2,5 s e o recibo abre. Com `?settle=manual`, ele só sai de `pending` pelo painel.

Para ver as recuperações, use os cenários abaixo: `order-timeout` (o envio fica sem resposta por 15 s, até o timeout do cliente; "Tentar novamente" recupera o mesmo pedido), `payment-rejected`, `coupon-expired`, `wallet-rejected` e `session-expired`. Pelo painel, subir o preço ou esgotar uma edição durante o pagamento faz a confirmação mostrar o que mudou.

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
| `pnpm test:visual`        | Regressão visual contra o build de produção            |
| `pnpm test:visual:update` | Regera as baselines de regressão visual                |
| `pnpm lighthouse`         | Auditoria Lighthouse (rode `pnpm build` antes)         |

Com `pnpm dev` rodando, `http://localhost:5173/__ui` mostra o catálogo de componentes do design system. A rota só existe em desenvolvimento.

## Testes

`pnpm test:e2e` sobe o servidor de desenvolvimento sozinho e roda tudo em Chromium desktop (1440×900) e mobile (390×844), sem serviço externo. Cada teste começa com o banco do mock restaurado, o cenário escolhido pela URL e armazenamento limpo. O relatório HTML fica em `playwright-report/` e os traces das falhas em `test-results/`.

| #   | Fluxo do enunciado                                               | Onde                                                                             |
| --- | ---------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| 1   | Busca, filtros, ordenação, paginação e histórico                 | `catalog.spec.ts`                                                                |
| 2   | Acesso direto ao detalhe e NFT inexistente                       | `nft-detail.spec.ts`                                                             |
| 3   | Cadastro, login, expiração de sessão, logout e troca de usuário  | `account.spec.ts`, `time.spec.ts`                                                |
| 4   | Favoritos, com falha de mutation e rollback                      | `catalog.spec.ts`                                                                |
| 5   | Carrinho: quantidade, remoção, cupom, refresh e login            | `cart.spec.ts`, `account.spec.ts`                                                |
| 6   | Compra completa, do catálogo ao recibo                           | `purchase.spec.ts`, `checkout.spec.ts`                                           |
| 7   | Pagamento recusado, clique repetido e timeout com o mesmo pedido | `checkout.spec.ts`, `time.spec.ts`                                               |
| 8   | Perfil, avatar, senha e carteiras, com erros de validação        | `account.spec.ts`                                                                |
| 9   | Preço e disponibilidade via Socket.IO durante o checkout         | `checkout.spec.ts`, `realtime.spec.ts`                                           |
| 10  | Eventos duplicados ou antigos, desconexão e pedido pendente      | `realtime.spec.ts`                                                               |
| 11  | Teclado, foco em diálogos e validação de formulários             | `design-system.spec.ts`, `account.spec.ts`, `nft-detail.spec.ts`, `a11y.spec.ts` |
| 12  | Skeletons em rede lenta, falha e nova tentativa                  | `catalog.spec.ts`                                                                |

Também há testes da API simulada isolada (`mock-api.spec.ts`), da expiração pelo tempo com `page.clock` (`time.spec.ts`) e de acessibilidade com axe nas quatro telas principais (`a11y.spec.ts`: nenhuma violação séria ou crítica).

**Regressão visual:** `pnpm test:visual` compara Início, detalhe, carrinho e pagamento, nos dois viewports, contra o build de produção (o comando faz o build). As baselines ficam em `tests/visual/` e levam o sistema operacional no nome, porque a renderização de fontes muda entre sistemas: as versionadas são de Windows. Em outro sistema, gere as suas com `pnpm test:visual:update` e confira as imagens antes de usá-las.

### Como reproduzir os fluxos de falha

| Fluxo                              | Como                                                                                                                          |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Timeout com recuperação            | `?scenario=order-timeout`, confirme a compra, espere ~15 s e use "Tentar novamente": o mesmo pedido volta.                    |
| Pagamento recusado                 | `?scenario=payment-rejected` e confirme a compra.                                                                             |
| Preço muda no checkout             | No pagamento, painel de simulação → subir o preço de um item do carrinho: aparece o aviso e a confirmação pede um novo "sim". |
| Edição esgota                      | `?scenario=sold-out` (ou painel → esgotar edição) com o carrinho aberto.                                                      |
| Cupom expira no checkout           | `?scenario=coupon-expired`, aplique `KURIO10` no carrinho e confirme no pagamento.                                            |
| Sessão expira                      | `?scenario=session-expired` (ou painel → expirar sessão) e navegue para uma página privada.                                   |
| Queda do tempo real                | Painel → derrubar a conexão: aviso de desconexão, reconexão e dados da tela recarregados.                                     |
| Clique repetido                    | Clique várias vezes em "Confirmar compra": sai um único pedido.                                                               |
| Rede lenta, falha e nova tentativa | `?scenario=slow-network`, `?scenario=server-error` ou `?scenario=offline`.                                                    |

## Auditorias (Lighthouse)

`pnpm build && pnpm lighthouse` serve o build de produção (`vite preview`, mocks ligados, cenário `default`) e audita Início e detalhe, em mobile e desktop, 3 vezes cada. Os relatórios HTML e JSON da medição mediana ficam em `lighthouse/`, com o resumo em `lighthouse/summary.md`.

Medianas (21/10/2026):

| Página  | Perfil  | Performance | Acessibilidade | Boas práticas | SEO | LCP    | CLS   | TBT    |
| ------- | ------- | ----------- | -------------- | ------------- | --- | ------ | ----- | ------ |
| Início  | mobile  | 82          | 100            | 100           | 100 | 3,62 s | 0,020 | 143 ms |
| Início  | desktop | 99          | 100            | 100           | 100 | 0,78 s | 0,001 | 5 ms   |
| Detalhe | mobile  | 78          | 100            | 100           | 100 | 3,80 s | 0,000 | 204 ms |
| Detalhe | desktop | 99          | 100            | 100           | 100 | 0,84 s | 0,000 | 6 ms   |

**Condições:** Lighthouse 13.5.0, Chromium 156 headless (o do Playwright), Node 22.14.0, Intel Core i7-13620H (16 núcleos), Windows 11. Mobile = perfil padrão do Lighthouse (4G lento simulado, CPU 4× mais lenta); desktop = configuração desktop oficial. A CPU 4× mais lenta é simulada a partir da CPU real, então a nota mobile varia com a carga da máquina: a tabela foi medida com `benchmarkIndex` ~2900; com a máquina ocupada por outros programas (`benchmarkIndex` ~2100), o mesmo build marcou 73 (Início) e 72 (detalhe) no mobile, sem mudança no desktop.

**Performance mobile abaixo da meta (90):** o LCP é a primeira imagem do catálogo (no detalhe, a arte do NFT), e ela só aparece depois que a API simulada responde. Antes da primeira renderização, o navegador baixa ~311 kB de JavaScript (gzip) e registra o service worker do MSW; ~62 kB desse JavaScript e o registro do worker existem só por causa da simulação. No perfil mobile (rede e CPU lentas simuladas), isso coloca o FCP em ~3,2 s e o LCP em ~3,6–3,8 s. Com uma API real, o chunk dos mocks e o registro do worker saem do caminho crítico. O que foi otimizado sem tirar nada da página (code splitting por rota, entrada mínima, preload dos chunks de inicialização, bundle dos mocks de 177 kB para 62 kB, imagens dimensionadas e priorizadas) está em [ARCHITECTURE.md › Desempenho](./ARCHITECTURE.md#desempenho). Desktop e as demais categorias ficam acima das metas.

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
| @axe-core/playwright                 | 4.14.0   |
| Lighthouse                           | 13.5.0   |
| ESLint                               | 10.13.0  |
