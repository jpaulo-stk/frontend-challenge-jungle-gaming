# Arquitetura — Kurio

Documento vivo: cada seção é preenchida junto com a parte da aplicação que ela descreve.

## Visão geral

SPA em React + TypeScript sem backend real. Toda a API, a sessão, as carteiras, o pagamento e o tempo real são simulados **na camada de rede** (MSW + Socket.IO), de forma que o código da aplicação é o mesmo que falaria com um servidor de verdade.

| Responsabilidade     | Tecnologia                         |
| -------------------- | ---------------------------------- |
| Interface            | React 19                           |
| Linguagem            | TypeScript 6 (`strict`)            |
| Roteamento           | TanStack Router (rotas por código) |
| Estado remoto        | TanStack Query 5                   |
| Cliente HTTP         | Axios (instância única)            |
| Contratos            | zod 4 (fonte única dos tipos)      |
| Tempo real           | socket.io-client                   |
| Estilo / componentes | Tailwind CSS 4 + shadcn/ui         |
| Mocking              | MSW 2 + `@mswjs/socket.io-binding` |
| Testes E2E e visuais | Playwright                         |
| Auditoria            | Lighthouse                         |

## Organização do código

Organização por feature. Cada feature é dona de seus contratos, hooks, componentes e páginas; o que é usado por mais de uma feature sobe para `shared/`.

```
src/
  main.tsx          bootstrap (único ponto que pode ligar os mocks)
  app/              router, providers, query client, layout raiz, 404
  features/<nome>/  api/ (schemas zod + chamadas + query options), components/, hooks/, routes/
  shared/           api/ (axios, erros, chaves de query), realtime/, ui/, lib/, hooks/
  mocks/            handlers MSW, banco em memória, fixtures, cenários, socket
  styles/           tokens do design (@theme do Tailwind)
```

As fronteiras são verificadas no lint (`eslint-plugin-boundaries`), não por convenção:

| De → Para    | Permitido                                               |
| ------------ | ------------------------------------------------------- |
| `main.tsx`   | `app`, `shared`, `mocks`, `styles`                      |
| `app`        | `app`, `features/*`, `shared`, `styles`                 |
| `features/X` | `shared` e a própria `features/X` — nunca outra feature |
| `shared`     | apenas `shared`                                         |
| `mocks`      | `mocks`, `shared` e os contratos zod das features       |

Um arquivo em `src/` que não pertença a nenhuma dessas camadas também falha no lint (`boundaries/no-unknown-files`).

**Onde ficam os contratos.** O schema zod é a fonte única de cada tipo.

- Contratos de uma feature só ficam em `features/<x>/api/schemas.ts`: sessão, filtros do catálogo, detalhe, favoritos e perfil.
- Contratos usados por mais de uma feature ficam em `shared/api/contracts/`, porque uma feature não pode importar outra:
  - NFT (catálogo, detalhe, carrinho e favoritos);
  - carrinho e cotação (`cart` e `checkout`);
  - pedido (`checkout` e `orders`);
  - carteira (`wallets` e `checkout`).
- Os eventos de tempo real ficam em `shared/realtime/events.ts`.
- Os mocks importam esses mesmos schemas, então os handlers validam as requisições com o contrato que o app usa.

### Rotas

Rotas declaradas por código em `src/app/router.tsx`, com os componentes vindos das features. Rotas por código foram escolhidas em vez de rotas por arquivo para manter as páginas dentro da pasta de cada feature sem um gerador de árvore de rotas. As páginas acessam parâmetros tipados com `getRouteApi('/rota')`, sem importar o router.

| Rota                | Acesso  | Feature        |
| ------------------- | ------- | -------------- |
| `/`                 | público | `catalog`      |
| `/nft/$nftId`       | público | `nft-detail`   |
| `/carrinho`         | público | `cart`         |
| `/pagamento`        | privado | `checkout`     |
| `/pedido/$orderId`  | privado | `orders`       |
| `/entrar`           | público | `auth`         |
| `/criar-conta`      | público | `auth`         |
| `/perfil`           | privado | `profile`      |
| `/perfil/dados`     | privado | `profile`      |
| `/perfil/carteiras` | privado | `wallets`      |
| qualquer outra      | —       | 404 do projeto |

Rotas privadas usam o guard `requireAuth` em `beforeLoad`. Sem sessão, ele redireciona para `/entrar?redirect=<destino>`. O parâmetro `redirect` só aceita caminhos internos (começando com `/` e não com `//`), para não virar um redirecionamento aberto.

## Cliente HTTP e erros

- `shared/api/axios.ts` contém a única instância Axios: `baseURL: /api` e `timeout` de 15 s.
- **Interceptor de request:**
  - Anexa `Authorization: Bearer <token>` quando há sessão. O token é opaco, emitido pela API; nenhuma senha é guardada no cliente.
  - Envia sempre `X-Visitor-Id`, um UUID anônimo guardado no `localStorage` que identifica o carrinho do visitante até o login.
- **Interceptor de response:** converte qualquer falha em `AppError` (`code`, `status`, `details`, `fields`).
  - O envelope de erro da API (`{ error: { code, message, fields } }`) é validado com zod.
  - Sem envelope, o código é derivado do status HTTP.
  - Sem resposta, a falha vira `NETWORK_ERROR` ou `TIMEOUT`.
- **401 com sessão:** quando a request levava sessão, o interceptor emite o evento `session-expired` (`shared/api/session-events.ts`). Um 401 sem sessão, como no login, é só um erro comum para quem chamou.
- **Mensagens:** todas as mensagens em pt-BR ficam em um único mapa `code → mensagem`, em `shared/api/errors.ts`.

## Contratos REST

Base `/api`, JSON e valores em ETH **sempre como string decimal** (`"26.846"`), inclusive totais. Quantidades são inteiras.

### Formato de erro

Toda resposta de erro usa o mesmo formato:

```json
{
  "error": {
    "code": "COUPON_EXPIRED",
    "message": "Este cupom expirou.",
    "fields": { "couponCode": "Este cupom expirou." }
  }
}
```

`fields` aparece em erros de validação e de conflito e é indexado pelo nome do campo do formulário.

| Situação              | Status | Códigos                                                                                                                                                                                                 |
| --------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Validação             | 422    | `VALIDATION_ERROR`, `COUPON_INVALID`, `COUPON_EXPIRED`, `WRONG_PASSWORD`, `AVATAR_INVALID`, `AVATAR_TOO_LARGE`, `CART_EMPTY`                                                                            |
| Sessão inválida       | 401    | `UNAUTHORIZED` (sem sessão), `SESSION_EXPIRED` (token vencido ou encerrado), `INVALID_CREDENTIALS`                                                                                                      |
| Recurso inexistente   | 404    | `NFT_NOT_FOUND`, `ORDER_NOT_FOUND`, `CART_ITEM_NOT_FOUND`, `WALLET_NOT_FOUND`                                                                                                                           |
| Conflito              | 409    | `EMAIL_TAKEN`, `USERNAME_TAKEN`, `EDITION_SOLD_OUT`, `INSUFFICIENT_AVAILABILITY`, `QUOTE_STALE`, `QUOTE_HAS_ISSUES`, `IDEMPOTENCY_CONFLICT`, `WALLET_REJECTED`, `WALLET_NOT_CONNECTED`, `WALLET_EXISTS` |
| Falha transitória     | 500    | `SERVER_ERROR`                                                                                                                                                                                          |
| Requisição malformada | 400    | `BAD_REQUEST`, `IDEMPOTENCY_KEY_REQUIRED`, `VISITOR_ID_REQUIRED`                                                                                                                                        |

Falta de permissão aparece como 404: um pedido de outro colecionador responde `ORDER_NOT_FOUND`. Assim, um id de pedido não revela se o pedido existe.

### Endpoints

| Recurso   | Endpoint                                                                           | Corpo / parâmetros                                                                                                                                                 | Resposta                                                                                 |
| --------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| Cadastro  | `POST /auth/register`                                                              | `{ username, email, password }`                                                                                                                                    | 201 `{ user, expiresAt, token }`; 409 `EMAIL_TAKEN`/`USERNAME_TAKEN`                     |
| Login     | `POST /auth/login`                                                                 | `{ email, password }`                                                                                                                                              | 200 `{ user, expiresAt, token }`; 401 `INVALID_CREDENTIALS`                              |
| Sessão    | `GET /auth/session`                                                                | —                                                                                                                                                                  | 200 `{ user, expiresAt }`; 401                                                           |
| Logout    | `POST /auth/logout`                                                                | —                                                                                                                                                                  | 204                                                                                      |
| Catálogo  | `GET /nfts`                                                                        | `q`, `collection[]`, `network[]`, `priceMin`, `priceMax`, `tab` (`all`/`new`/`trending`), `sort` (`recent`/`price_asc`/`price_desc`/`trending`), `page`, `perPage` | `{ items, page, perPage, total, totalPages }`                                            |
| Detalhe   | `GET /nfts/:id`                                                                    | —                                                                                                                                                                  | NFT com descrição, galeria, edições e avaliação; 404 `NFT_NOT_FOUND`                     |
| Filtros   | `GET /facets`                                                                      | —                                                                                                                                                                  | coleções e redes com contagem, faixa de preço                                            |
| Favoritos | `GET /favorites`, `POST /favorites`, `DELETE /favorites/:nftId`                    | `{ nftId }`                                                                                                                                                        | lista de NFTs; 201; 204 — exige sessão                                                   |
| Carrinho  | `GET /cart`, `POST /cart/items`, `PATCH /cart/items/:id`, `DELETE /cart/items/:id` | `{ nftId, editionId, quantity }` / `{ quantity }`                                                                                                                  | carrinho completo; 409 se faltar estoque na edição                                       |
| Cotação   | `POST /cart/quote`                                                                 | `{ couponCode \| null }`                                                                                                                                           | `{ quoteId, lines, subtotal, discount, networkFee, total, coupon, expiresAt, issues[] }` |
| Pedido    | `POST /orders` + cabeçalho `Idempotency-Key`                                       | `{ quoteId, walletId, connectionId, buyer }`                                                                                                                       | 201 novo / 200 mesmo pedido; 409 `QUOTE_STALE`, `IDEMPOTENCY_CONFLICT`                   |
| Pedido    | `GET /orders`, `GET /orders/:id`                                                   | `?status=pending`                                                                                                                                                  | pedido com recibo congelado                                                              |
| Perfil    | `GET /profile`, `PATCH /profile`                                                   | campos parciais                                                                                                                                                    | perfil; 409 com `fields` em conflito                                                     |
| Avatar    | `POST /profile/avatar` (multipart `avatar`), `DELETE /profile/avatar`              | PNG/JPEG/WebP até 1 MB                                                                                                                                             | perfil atualizado                                                                        |
| Senha     | `POST /profile/password`                                                           | `{ currentPassword, newPassword }`                                                                                                                                 | 204; 422 `WRONG_PASSWORD`                                                                |
| Carteiras | `GET /wallets`, `POST /wallets`, `PATCH /wallets/:id`                              | campos do formulário + `role` (`primary`/`secondary`)                                                                                                              | `{ primary, secondary }`; endereço validado como `0x` + 40 hex                           |
| Conexão   | `POST /wallet-connections`, `DELETE /wallet-connections/:id`                       | `{ walletId, provider, network }`                                                                                                                                  | 201 `{ id, status: "connected" }`; 409 `WALLET_REJECTED`                                 |

### Regras que o mock garante

- **Carrinho de visitante:** fica associado ao `X-Visitor-Id`. No login ou no cadastro, é mesclado ao carrinho do colecionador. As quantidades da mesma edição somam, limitadas ao estoque.
- **Cotação:** é a referência dos totais. O subtotal, o desconto do cupom, a taxa de rede (`0.016`) e o total são calculados com `big.js`. A cotação lista em `issues` os problemas:
  - `PRICE_CHANGED`: informativo;
  - `EDITION_SOLD_OUT` e `INSUFFICIENT_AVAILABILITY`: bloqueiam a compra.
- **Pedido idempotente:** a chave é guardada por colecionador.
  - Mesma chave com o mesmo corpo (comparação por serialização estável) devolve o pedido existente.
  - Mesma chave com outro corpo responde 409.
  - Cinco cliques simultâneos criam um único pedido.
- **Revalidação:** o pedido é conferido contra uma cotação recalculada na hora. Preço, estoque, cupom ou total diferentes respondem `QUOTE_STALE`.
- **Estados do pedido:** o pedido nasce `pending` e é liquidado depois de um intervalo para `confirmed` ou `rejected`, que são estados terminais.
  - A liquidação é retomada depois de um refresh, porque o momento previsto fica salvo em `settleAt`.
  - Na confirmação, o estoque cai (`nft.updated`) e **só as quantidades compradas** saem do carrinho.
- **Recibo:** o pedido guarda uma cópia das linhas e dos valores. Mudar o catálogo depois não altera o recibo, e isso é verificado em teste.
- **Senhas:** só são guardadas como SHA-256 com salt, nunca em texto. Um teste confere que nenhuma senha aparece no `localStorage`.

## Eventos em tempo real

Transporte Socket.IO, só WebSocket, em `VITE_REALTIME_URL` (padrão `wss://realtime.kurio.test`). A identidade vai no handshake (`auth: { token }`).

| Evento          | Direção            | Payload                                                                          | Destinatários                                |
| --------------- | ------------------ | -------------------------------------------------------------------------------- | -------------------------------------------- |
| `nft.updated`   | servidor → cliente | `{ eventId, id, version, price, previousPrice, available, editions, updatedAt }` | conexões inscritas no NFT (ou em `*`)        |
| `order.updated` | servidor → cliente | `{ eventId, id, version, status, updatedAt }`                                    | só conexões autenticadas como dono do pedido |
| `subscribe`     | cliente → servidor | `{ resource: "nft", ids: string[] }`                                             | —                                            |
| `unsubscribe`   | cliente → servidor | `{ resource: "nft", ids: string[] }`                                             | —                                            |

Todo evento carrega:

- **`eventId`:** identidade estável. Uma duplicata chega com o mesmo `eventId`.
- **`id`:** o recurso afetado.
- **`version`:** cresce a cada mudança do recurso.

O cliente descarta eventos com `version` menor ou igual à que já tem.

## API simulada (MSW)

Toda resposta fictícia vive em `src/mocks/`. Componentes, hooks e o cliente Axios não contêm dados nem caminhos alternativos, e um grep sem resultados fora de `src/mocks/` confirma isso.

### Ativação e inicialização

- **Ativação:** `VITE_ENABLE_MOCKS=true` (já em `.env`) liga os mocks em desenvolvimento e no build de demonstração.
- **Ordem de inicialização:** o `main.tsx` sobe o worker e só depois importa o app. O motivo é que o `engine.io-client` captura `globalThis.WebSocket` no momento em que o módulo é avaliado. Se o app carregasse antes, o socket escaparia da interceptação.
- **Custo de performance:** o chunk dos mocks (~183 kB com gzip) carrega antes do app. Isso entra na análise do Lighthouse.

### Transporte do tempo real e limitações

- **Por que MSW 2:** usamos MSW 2.15 com `@mswjs/socket.io-binding` 0.2.0, o pacote citado no enunciado. O MSW 3 já existe, mas o binding exige `msw ^2.10` e ainda não há extensão Socket.IO publicada para a versão 3. Seguimos com o pacote citado, sem forçar um peer incompatível.
- **Sem servidor real:** o MSW intercepta o `WebSocket` aberto pelo `socket.io-client`, e o binding fala o protocolo Engine.IO/Socket.IO por cima. O cliente continua sendo o `socket.io-client` de verdade.
- **Link pela origem:** o MSW remove `/socket.io/` do caminho antes de comparar a URL. Por isso o link é a origem `wss://realtime.kurio.test`, e não um caminho na mesma origem do app, que colidiria com o WebSocket de HMR do Vite.
- **Só WebSocket:** não há transporte por long-polling. O cliente é configurado com `transports: ["websocket"]`.
- **Handshake e heartbeat:** o binding responde ao handshake com dados fixos. O heartbeat (ping a cada 25 s) é enviado pelo mock; sem ele, o cliente derrubaria a conexão após cerca de 30 s.
- **Namespace:** só `/`. Salas (inscrições por NFT) e o roteamento por dono do pedido são implementados no mock.

### Estado, persistência e reset

- **Banco único:** um único banco em memória (`mocks/db/`) alimenta o REST e os eventos. Toda mudança de preço ou estoque passa por `changeNft()`, que incrementa a versão e publica `nft.updated`.
- **Persistência:** o banco é salvo no `localStorage` (`kurio.mock-db`), então carrinho, sessão, favoritos e pedidos sobrevivem a refresh.
- **Reset:** trocar de cenário, abrir `?reset=1` ou usar "Restaurar dados" no painel reconstrói o banco a partir das fixtures.
- **Determinismo:** a latência e as falhas intermitentes usam um gerador pseudoaleatório com seed (`?seed=`, padrão 42). A mesma seed e a mesma sequência de requisições repetem o mesmo resultado.

### Controle (painel e testes)

As ações de controle ficam em `src/mocks/controls.ts` (`window.__kurioMock`):

- mudar preço ou estoque;
- liquidar um pedido;
- repetir o último evento;
- enviar um evento com versão antiga;
- derrubar as conexões;
- armar a expiração de sessão.

Todas mudam o banco ou o servidor simulado. Os eventos sempre chegam ao app pelo `socket.io-client`, nunca por estado do app.

O painel de dev, montado numa raiz React separada, usa a mesma API. Ele aparece em desenvolvimento ou com `?painel=1` no build de demonstração.

## Estratégia de cache

Defaults globais em `src/app/query-client.ts`. Cada domínio ajusta `staleTime`/`gcTime` nas próprias query options, e a tabela por domínio é completada junto com cada feature.

| Opção                          | Valor                                       | Por quê                                                                                                                                                                        |
| ------------------------------ | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `queries.staleTime`            | 30 s                                        | O catálogo tolera dado um pouco antigo. Mudanças de preço e disponibilidade chegam por evento (`nft.updated`), não por polling, então refetch agressivo não traz frescor real. |
| `queries.gcTime`               | 5 min                                       | Voltar a uma listagem ou detalhe recente é instantâneo, sem acumular memória indefinidamente.                                                                                  |
| `queries.retry`                | até 2 tentativas, só para falha transitória | Rede, timeout, 5xx e 429 podem se resolver sozinhos. Erros 4xx (validação, 404, 401, conflito) não mudam se repetidos, então falham na hora e a UI mostra o erro.              |
| `queries.retryDelay`           | exponencial: 1 s, 2 s, 4 s… (teto 8 s)      | Evita martelar um servidor degradado e dá tempo para uma falha transitória passar.                                                                                             |
| `queries.refetchOnWindowFocus` | desligado                                   | Voltar à aba no meio do checkout não pode disparar uma nova cotação de surpresa. Onde revalidar no foco fizer sentido, a query liga isso explicitamente.                       |
| `mutations.retry`              | 0                                           | Repetir uma mutation automaticamente pode duplicar efeitos (o caso crítico é o pedido). A recuperação de pedido é explícita, com chave de idempotência.                        |

Regras que valem para todo o projeto:

- **Chaves por factory.** Use `shared/api/query-keys.ts` (`nftKeys.list(params)`, `cartKeys.detail()`…). Nenhum componente monta array de chave na mão. Os parâmetros da busca fazem parte da chave, então cada combinação de filtros tem seu próprio cache.
- **Isolamento por usuário.** Logout e troca de usuário chamam `queryClient.clear()`, que remove todo dado privado em cache.

## Dependências

Cada dependência fora da stack obrigatória tem uma justificativa:

| Pacote                                                     | Por quê                                                                                                |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `zod`                                                      | Contratos validados em runtime, com tipos derivados (`z.infer`); fonte única entre API, mocks e UI.    |
| `react-hook-form` + `@hookform/resolvers`                  | Formulários performáticos, com validação pelo mesmo schema zod.                                        |
| `big.js`                                                   | Aritmética decimal exata para valores em ETH, que trafegam como string; `number` perderia precisão.    |
| `zustand`                                                  | Estado de interface mínimo (drawer aberto, flags), fora do servidor e da URL.                          |
| `sonner`                                                   | Toasts acessíveis (`aria-live`) compatíveis com shadcn/ui.                                             |
| `lucide-react`                                             | Ícones em SVG com tree-shaking.                                                                        |
| `@fontsource/jetbrains-mono`                               | Fonte self-hosted; ver "Substituição de assets".                                                       |
| `@tanstack/react-query-devtools`                           | Inspeção do cache em desenvolvimento; carregado sob demanda e fora do build de produção.               |
| `eslint-plugin-boundaries`                                 | Garante no lint as fronteiras entre features, `shared` e `mocks`.                                      |
| `eslint-import-resolver-typescript`                        | Resolve o alias `@/` para o `eslint-plugin-boundaries`.                                                |
| `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh` | Regras de hooks e compatibilidade com HMR.                                                             |
| `prettier`                                                 | Formatação consistente.                                                                                |
| `radix-ui`                                                 | Primitivos acessíveis (foco preso, teclado, ARIA) por trás dos componentes shadcn/ui.                  |
| `class-variance-authority`                                 | Variantes tipadas dos componentes (botão, badge, stepper).                                             |
| `cn`                                                       | Junção de classes com resolução de conflitos do Tailwind, usada pelos componentes shadcn/ui.           |
| `vaul`                                                     | Drawer inferior com gesto de arrastar, base do `drawer` do shadcn/ui no mobile.                        |
| `shadcn`, `tw-animate-css` (dev)                           | CLI que gera os componentes e as variantes/animações de CSS que eles usam; só atuam no build.          |
| `msw` (dependência de runtime)                             | API simulada na camada de rede; fica em `dependencies` porque roda no build de demonstração publicado. |
| `@mswjs/socket.io-binding`                                 | Protocolo Socket.IO sobre a interceptação de WebSocket do MSW; ver "Transporte do tempo real".         |

## Design system

### Tokens

Todas as cores, raios e a fonte estão declarados uma única vez, no `@theme` de `src/styles/globals.css`, com os valores medidos no Figma. Nenhum `.ts`/`.tsx` contém cor literal.

Os nomes semânticos do shadcn/ui (`background`, `card`, `muted`, `ring`…) são mapeados em `@theme inline` para a paleta Kurio. Assim os componentes gerados herdam o tema sem que a paleta neutra de fábrica sobreviva em lugar nenhum. O produto é só escuro: `<html class="dark">`.

### Componentes shadcn/ui adaptados

Ficam em `src/shared/ui/` (alias configurado em `components.json`). O que mudou em relação ao padrão:

- **Botão:** variantes `default` (fundo `--primary`, texto `--bg`), `outline` (borda `--primary`), `ghost`, `destructive` e `link`.
  - Abaixo de `md`, 56px de altura e formato pill, como nos frames mobile.
  - A partir de `md`, 44px de altura e raio 6, como nos frames desktop.
  - `aria-disabled` tem estilo próprio (ver "Ações fora do escopo").
- **Input e select:** fundo `--surface`, borda de 1,5px, placeholder `--text-dim`. No foco a borda fica `--primary` com anel; quando inválido, `--danger`. Altura de 56px no mobile e 44px no desktop.
- **Abas:** variante de linha, com item ativo em `--primary-hi` e sublinhado. Rolam horizontalmente quando não cabem (360px).
- **Slider:** trilho `--border-strong`, faixa e polegares `--primary`.
- **Checkbox e radio:** 20px com borda de 1,5px.
- **Diálogo:** 500px de largura, `--surface`, overlay escurecido e rótulo "Fechar".
- **Foco:** todos os controles usam anel `--primary-hi` com deslocamento. O fallback global de `:focus-visible` cobre qualquer elemento sem estilo próprio.

O `form` antigo do shadcn não existe mais no estilo atual (`radix-nova`). O substituto é o `field`, combinado com react-hook-form nas telas de formulário.

### Componentes próprios

| Componente                                   | Observação                                                                                                                                      |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `app-header`                                 | Desktop (≥768px). O item ativo usa o `data-status` do TanStack Router.                                                                          |
| `app-tab-bar`                                | Mobile (<768px): barra fixa de 72px com ação central de 56px, como no frame `mobile-01-inicio`.                                                 |
| `app-footer`                                 | Três faixas (250/88/236) com as colunas exatas do Figma a partir de 1280px; abaixo disso as colunas são fluidas.                                |
| `nft-card`                                   | Caixa de 258×300 com arte de 250×250 (raio 15). A barra de ações aparece no hover **e** com foco dentro do card; no mobile fica sempre visível. |
| `price`                                      | Recebe string decimal; o preço anterior é riscado **e** anunciado como "Preço anterior" (não depende só de cor).                                |
| `quantity-stepper`                           | Desabilita nos limites, anuncia o valor com `aria-live` e explica o limite da edição.                                                           |
| `empty-state`, `error-state`, `inline-error` | Estados não desenhados no mesmo padrão visual (`--surface`, borda `--border`, texto `--text-muted`).                                            |
| `skeleton/*`                                 | Mesmas dimensões do conteúdo real (o skeleton do card mede 258×300, verificado em teste). O shimmer para sob `prefers-reduced-motion`.          |
| `social-icon`                                | Ícones de marca copiados dos paths do SVG do Figma, porque o lucide não traz mais ícones de marca.                                              |

O catálogo de componentes em `/__ui` mostra tudo nos estados normal, foco, desabilitado, erro e carregando. A rota só existe em desenvolvimento: no build de produção, o ramo inteiro, incluindo o `import()`, é eliminado.

### Contraste

Todas as combinações de cor em uso foram verificadas contra o critério de 4,5:1:

- Texto `--text`, `--text-muted`, `--text-dim`, `--primary`, `--primary-hi`, `--danger` e `--success` sobre `--bg`, `--surface`, `--surface-2` e `--surface-3`.
- Texto `--bg` sobre `--primary`, `--primary-hi` e `--primary-alt`.

A menor razão é 4,75:1 (`--success` sobre `--surface-3`). A maior parte das combinações fica acima de 6:1.

### Ações fora do escopo

O enunciado exclui páginas editoriais, suporte, atividade, ofertas e downloads, e pede que ações fora do escopo não pareçam funcionar. Os controles do layout que levam a esses destinos usam `UnavailableAction`:

- Exemplos: "Criadores" e "Aprenda" no header, os links de ajuda e redes sociais do rodapé, a newsletter e "Favoritos" na tab bar.
- O botão continua focável e tem `aria-disabled="true"`.
- O nome acessível ganha o sufixo "(indisponível nesta demonstração)".
- Ao ser acionado, mostra um aviso informativo em toast. Nunca mostra um aviso de sucesso.

### Decisões de navegação

- **Mercado:** no Figma, "Mercado" é a listagem do catálogo, que fica na própria Início. O link leva a `/#catalogo`.
- **Busca:** no desktop, o ícone de busca leva a `/#busca`. No mobile, a ação central da tab bar faz o mesmo.

## Ferramentas

- **pnpm fixado em 10.34.7** (campo `packageManager`). A linha 12 do pnpm é distribuída como binário nativo, que o corepack 0.31 (empacotado com o Node 22) não executa. A linha 10 segue mantida e funciona com qualquer corepack.
- **Node 22** (`.nvmrc` e `engines`), com mínimo de 22.12 exigido pelo Vite 8.

## Substituição de assets

- **Fonte:** o export do Figma vetorizou os textos, então o nome da fonte não está no arquivo. A comparação de glifos (zero pontilhado, `1` com base reta, caixa-alta geométrica) indica **JetBrains Mono**, servida localmente via `@fontsource/jetbrains-mono`.
  - Pesos: 400, 500 e 700, só no subconjunto `latin`, que cobre os acentos do português.
  - Carregamento: `font-display: swap`.
  - Preload: o peso 400 é pré-carregado por um plugin do Vite (`vite.config.ts`) que injeta a tag com o nome do arquivo já com hash.
- **Artes dos NFTs:** as 4 artes do Figma estão em `public/nfts/`, nas versões `-400.webp` (cards) e `-800.webp` (detalhe). Os PNGs originais de 1254px (~2 MB cada) não são usados na aplicação.
