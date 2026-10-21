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

| Rota                | Acesso                             | Feature        |
| ------------------- | ---------------------------------- | -------------- |
| `/`                 | público                            | `catalog`      |
| `/nft/$nftId`       | público                            | `nft-detail`   |
| `/carrinho`         | público                            | `cart`         |
| `/pagamento`        | privado                            | `checkout`     |
| `/pedido/$orderId`  | privado                            | `orders`       |
| `/favoritos`        | privado                            | `favorites`    |
| `/entrar`           | visitante (diálogo sobre a Início) | `auth`         |
| `/criar-conta`      | visitante (diálogo sobre a Início) | `auth`         |
| `/perfil`           | privado                            | `profile`      |
| `/perfil/dados`     | privado                            | `profile`      |
| `/perfil/carteiras` | privado                            | `wallets`      |
| qualquer outra      | —                                  | 404 do projeto |

Rotas privadas usam o guard `requireAuth` em `beforeLoad`.

- **Sessão:** o guard lê a sessão real (`GET /auth/session`) pelo `queryClient` do contexto do router.
- **Sem sessão:** redireciona para `/entrar?redirect=<destino>`.
- **Parâmetro `redirect`:** só aceita caminhos internos (começando com `/` e não com `//`), para não virar um redirecionamento aberto.

`/nft/$nftId` tem um `loader` que carrega o NFT no cache do Query antes de renderizar:

- **NFT inexistente:** `NFT_NOT_FOUND` vira `notFound()` e mostra a 404 do projeto dentro do layout.
- **Rede lenta:** depois de 200 ms, o skeleton do detalhe aparece como `pendingComponent`.
- **Outras falhas:** caem no `errorComponent`, que tem "Tentar novamente".

### Login e cadastro sobre a Início

A Início é um layout sem caminho próprio (`/_catalog`) com três filhas: `/`, `/entrar` e `/criar-conta`. Assim o catálogo fica montado atrás do diálogo, e acesso direto ou refresh de `/entrar` mostram a Início ao fundo, nunca uma tela em branco.

- **Tamanho:** no desktop, o diálogo tem 500 px (600/656 de altura), como nos frames. No mobile, ocupa a tela cheia com o logo.
- **Fechar:** fechar o diálogo (Esc, X ou fundo) devolve o foco a quem o abriu e volta à página anterior. Os guards redirecionam com `replace`, então a página privada que pediu o login não fica no histórico: fechar volta para onde o colecionador estava (o carrinho, por exemplo). Sem página anterior (acesso direto), o destino é a Início.
- **Usuário com sessão:** um colecionador já logado que abre essas rotas segue direto para o destino.

### Estado do catálogo na URL

- **Parâmetros:** a busca, os filtros e a página vivem na URL (`q`, `collection`, `network`, `priceMin`, `priceMax`, `tab`, `sort`, `page`), validados por um schema zod no `validateSearch`.
- **Valores inválidos:** são descartados (`.catch`), sem quebrar a página.
- **Valores padrão:** ficam fora da URL, então a Início continua sendo `/`.
- **Serialização própria:** em vez do JSON padrão do router, as listas viram chaves repetidas, como em `?collection=musica&collection=jogos&page=2`. A URL fica legível e números decimais não são convertidos (`src/app/search-params.ts`).
- **`updateFilters`:** toda mudança de filtro passa por essa função única (`use-catalog-filters.ts`), que sempre volta para a página 1.
- **Busca:** a URL só é atualizada 350 ms depois da última tecla, com `replace` no histórico, para não criar um passo de "voltar" por tecla. Enter confirma na hora.
- **Respostas fora de ordem:** a `queryKey` é exatamente o conjunto de parâmetros enviados (`toListParams`), e o `AbortSignal` do Query cancela a requisição anterior no Axios. Uma resposta atrasada de uma busca antiga não chega à lista atual; o cenário `jitter` cobre isso em teste.
- **Revalidação:** ao trocar de página ou de filtro, a lista anterior continua visível, esmaecida e marcada com `aria-busy` (`placeholderData: keepPreviousData`). O skeleton só aparece no primeiro carregamento.

## Sessão e conta

- **Token:** a sessão é um token opaco emitido pela API no login ou cadastro, guardado no `localStorage` e enviado em `Authorization: Bearer`. Nenhuma senha passa pelo armazenamento do cliente. No mock, as senhas são guardadas como SHA-256 com salt.
- **Sessão como dado de servidor:** `GET /auth/session` fica no TanStack Query (`shared/session/session-api.ts`). Os guards das rotas privadas leem essa query; enquanto ela resolve, a rota mostra o `defaultPendingComponent` (skeleton) e não pisca para outra página.
- **Troca de identidade:** login, cadastro, logout e expiração passam por `startSession`/`endSession` (`shared/session/session-lifecycle.ts`), que primeiro chamam `queryClient.clear()` e só depois aplicam a nova identidade. Nenhum dado do colecionador anterior (favoritos, carrinho, perfil, pedidos) chega a renderizar. Ouvintes de troca de identidade (`onIdentityChange`) avisam o cliente de tempo real.
- **Carrinho do visitante:** no login ou cadastro, a API mescla o carrinho do `X-Visitor-Id` no do colecionador.
- **Expiração:** o interceptor do Axios emite `session-expired` quando uma requisição que levava sessão recebe `SESSION_EXPIRED` ou `UNAUTHORIZED`. Um 401 de senha errada no login não conta.
  - Com sessão conhecida, o app limpa o cache, avisa e leva a `/entrar?redirect=<página atual>`. Depois do login, volta exatamente para lá.
  - Um token velho encontrado no início (por exemplo, depois de um reset dos mocks) só é descartado, sem redirecionar quem está numa página pública.
- **Validação:** os formulários usam react-hook-form + zod, com o mesmo schema do contrato.
  - **Senha:** mínimo de 8 caracteres.
  - **Erros da API:** os erros por campo (`EMAIL_TAKEN`, `USERNAME_TAKEN`, `WRONG_PASSWORD`, endereço de carteira) vão para o campo, via `fields` do envelope de erro. Os demais aparecem no topo do formulário com `role="alert"`, sem apagar o que foi digitado.
- **Perfil:**
  - Dados e senha compartilham um único "Salvar", como no layout. Cada parte informa o próprio resultado.
  - O avatar é enviado na hora: tipo (PNG, JPEG, WebP) e tamanho (até 1 MB) são validados antes do envio, e uma prévia local aparece enquanto ele sobe.
  - O nome e o avatar salvos atualizam a sessão em cache, então o header muda sem nova requisição.
- **Carteiras:** a principal e a secundária usam o mesmo formulário. A secundária começa vazia, com a opção de copiar os dados da principal. A consulta fica em `shared/wallets/` porque o checkout também usa.
- **Mobile:** o perfil não tem frame no Figma. `/perfil` vira a lista de seções, e `/perfil/dados` e `/perfil/carteiras` abrem cada uma com um link para voltar.

## Carrinho, checkout e pedido

### Onde fica cada estado

| Estado                                                                                                 | Onde                                                                                   | Por quê                                                                  |
| ------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Itens do carrinho, cotação, pedidos, carteiras                                                         | TanStack Query (API)                                                                   | São dados de servidor; o carrinho persiste e é isolado por usuário lá.   |
| Cupom escolhido, itens deixados para depois, formulário, carteira, tentativa de envio, pedido pendente | Rascunho do checkout (`shared/checkout/checkout-draft.ts`, Zustand + `sessionStorage`) | Só o cliente sabe; precisa sobreviver a refresh e a uma sessão expirada. |

O rascunho é descartado no logout ou quando outro colecionador entra. Uma sessão que só expirou, retomada pelo mesmo colecionador, mantém tudo, e o checkout volta preenchido.

### Valores

- **A cotação manda.** Subtotal, desconto, taxa e total vêm de `POST /cart/quote` (`useCartQuote`). Enquanto uma nova cotação não volta (mudança de quantidade, por exemplo), o resumo mostra uma estimativa local com big.js, marcada como "Atualizando…" e com `aria-busy`. Ela é substituída pela resposta.
- **Compra parcial.** "Deixar para depois" tira um item da cotação (`itemIds`) sem tirá-lo do carrinho. A confirmação de um pedido remove do carrinho, no servidor, só os itens e as quantidades comprados.
- **Cupom.** Validado no carrinho; a cotação devolvida pela validação é reaproveitada no cache. Se o cupom cair depois (expirado no checkout), a cotação é refeita sem ele e o colecionador é avisado.

### Envio do pedido

1. "Confirmar compra" valida o formulário (zod) e exige carteira conectada. A conexão é simulada (`POST /wallet-connections`) e só vale para a carteira, o provedor e a rede com que foi feita.
2. Antes de enviar, a cotação é pedida de novo. Se preço, quantidade, disponibilidade, cupom, taxa ou total mudaram em relação ao que o colecionador viu, nada é enviado: um diálogo lista as diferenças e pede uma nova confirmação explícita. Item esgotado ou sem estoque bloqueia o envio.
   - **Cotação vista:** o checkout guarda a cotação que o colecionador já viu (`useAcknowledgedQuote`). Uma cotação nova causada por ele (cupom, item deixado para depois) é aceita ao chegar. Uma que mudou por evento (preço, disponibilidade) atualiza o resumo na hora, mas não substitui a vista: um aviso lista o que mudou e a confirmação compara com a cotação vista, exigindo o "sim" de novo.
3. Cada tentativa recebe uma `Idempotency-Key` (UUID), guardada no rascunho junto com o corpo antes do envio. Se a resposta não chega (timeout, rede, 5xx), "Tentar novamente" reenvia a mesma chave com o mesmo corpo, e a API devolve o mesmo pedido. Isso vale também depois de um refresh.
4. Cliques repetidos não criam um segundo pedido: uma trava síncrona cobre toda a sequência (cotação e envio), o botão fica desabilitado, a mutation não tem retry e a API deduplica pela chave.

### Estados do pedido

- **`pending`:** `/pedido/:id` mostra o processamento e se resolve pelo evento `order.updated`. Enquanto o tempo real estiver fora, a página consulta `GET /orders/:id` a cada 2 s como reserva. Ela sobrevive a refresh e nunca cria outro pedido.
- **`confirmed`:** o recibo abre como modal no desktop e em tela cheia no mobile. Todos os valores são a cópia congelada do pedido; mudar o catálogo depois não altera o recibo. O link do Etherscan é rotulado como simulado.
- **`rejected`:** mostra o motivo e avisa que o carrinho ficou como estava, com caminhos para o pagamento e o carrinho.
- Um pedido de outro colecionador responde 404 e cai na página de não encontrado.

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

### Cliente (`shared/realtime/`)

| Arquivo                                     | Papel                                                                             |
| ------------------------------------------- | --------------------------------------------------------------------------------- |
| `socket.ts`                                 | Cria o `socket.io-client` (só WebSocket, token no `auth`), importado sob demanda. |
| `realtime-client.ts`                        | Conexão única fora do React: identidade, inscrições, status e reconciliação.      |
| `apply-events.ts`                           | Único lugar em que evento toca o cache do Query, sempre com guarda de versão.     |
| `realtime-provider.tsx` / `use-realtime.ts` | Liga o cliente à sessão; `useNftSubscription(ids)` e `useRealtimeState()`.        |

- **Conexão:** abre quando a sessão é conhecida (visitante também conecta, para o catálogo). O provider lê a sessão do cache sem criar observador próprio: um observador acima do router, sob a montagem dupla do StrictMode, cancelaria o fetch que um guard está aguardando.
- **Troca de identidade:** login, logout ou expiração derrubam a conexão e abrem outra com a nova identidade. Além disso, cada conexão só aplica eventos se a sessão atual ainda for a dela: um evento que chegue pela conexão antiga é descartado.
- **Inscrição por tela:** catálogo, card em destaque, detalhe, "Mais desta coleção", favoritos, carrinho e pagamento inscrevem os NFTs que exibem e saem ao desmontar. As inscrições têm contagem de referência (duas telas no mesmo NFT, ou o StrictMode, não duplicam nem cancelam a sala da outra) e são reenviadas a cada conexão.
- **Guarda de versão:** `nft.updated` só é aplicado se a versão for maior que a maior conhecida (detalhe, listas, favoritos e as já aplicadas). Detalhe, listas e favoritos são atualizados no cache. Carrinho e cotação não têm versão: são recarregados da API, uma vez por evento aplicado. Duplicata e evento antigo não mudam nada nem repetem aviso.
- **Pedido:** `order.updated` só vale para um pedido que já está no cache do colecionador. O evento traz só o status, então o pedido completo (transação, recibo) vem de novo do REST.
- **Reconexão:** ao voltar, o que estiver na tela (NFTs, carrinho, cotação, pedidos, favoritos) é refeito via REST, em vez de confiar no que chegou ou deixou de chegar enquanto esteve fora.
- **Status:** `connecting | online | offline`. A interface fica quieta enquanto tudo funciona; depois de uma falha mostra um aviso discreto (`role="status"`) de que preços e pedidos podem estar desatualizados e, ao voltar, que a conexão foi restabelecida. Um handshake que não se completa conta como falha depois de 5 s.
- **Avisos:** mudança de preço ou disponibilidade de item do carrinho é anunciada por `aria-live="polite"` e aparece na linha do carrinho e no aviso do pagamento. Pedido confirmado ao vivo é anunciado; recusa usa `role="alert"`.
- **Disparo manual:** o painel de simulação e `window.__kurioMock` mudam o banco simulado (subir preço, esgotar edição, repetir o último evento, evento antigo, liquidar pedido, derrubar a conexão). O evento sempre chega pelo `socket.io-client`; `realtimeClients()` mostra as conexões e as salas de cada uma.

## API simulada (MSW)

Toda resposta fictícia vive em `src/mocks/`. Componentes, hooks e o cliente Axios não contêm dados nem caminhos alternativos, e um grep sem resultados fora de `src/mocks/` confirma isso.

### Ativação e inicialização

- **Ativação:** `VITE_ENABLE_MOCKS=true` (já em `.env`) liga os mocks em desenvolvimento e no build de demonstração.
- **Ordem de inicialização:** o `main.tsx` baixa o app em paralelo com a subida do worker, mas só renderiza (e só faz requisições) depois que os mocks respondem.
- **`socket.io-client` sob demanda:** o `engine.io-client` captura `globalThis.WebSocket` no momento em que o módulo é avaliado. Por isso o app só importa o `socket.io-client` dentro de `createRealtimeSocket` (`shared/realtime/socket.ts`), depois da inicialização; importado antes, o socket escaparia da interceptação.
- **Custo de performance:** o chunk dos mocks (~180 kB com gzip) ainda precisa subir antes da primeira renderização, mas não atrasa mais o download do app. Isso entra na análise do Lighthouse.

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

Ajustes por domínio:

| Domínio             | `staleTime`   | Por quê                                                                                                     |
| ------------------- | ------------- | ----------------------------------------------------------------------------------------------------------- |
| Favoritos           | 60 s          | Dado privado que só muda por ação do próprio colecionador, e essa ação invalida a lista.                    |
| Catálogo (lista)    | 30 s (padrão) | Preço e disponibilidade chegam por evento; ao mudar de filtro ou página, a lista anterior fica visível.     |
| Filtros (`/facets`) | 5 min         | As contagens quase não mudam.                                                                               |
| Detalhe do NFT      | 30 s          | Também atualizado por evento. Sem nova tentativa automática para `NFT_NOT_FOUND`.                           |
| Relacionados        | 60 s          | Vitrine secundária.                                                                                         |
| Sessão              | 5 min         | Revalidada no login, no logout e em respostas 401; não precisa de polling.                                  |
| Carrinho            | 15 s          | Atualizado pelas mutations; uma janela curta cobre mudanças vindas de outra aba.                            |
| Perfil              | 60 s          | Muda só por edição do próprio colecionador, que grava a resposta no cache.                                  |
| Carteiras           | 60 s          | Idem; a mesma consulta abastece o checkout.                                                                 |
| Cotação             | 30 s          | A chave inclui cupom, itens e versão do carrinho. Antes de enviar o pedido ela é sempre pedida de novo.     |
| Pedido              | 0 / ∞         | Pendente: liquidado por `order.updated` (consulta a cada 2 s só sem tempo real). Terminal: nunca é refeito. |

Regras que valem para todo o projeto:

- **Chaves por factory.** Use `shared/api/query-keys.ts` (`nftKeys.list(params)`, `cartKeys.detail()`…). Nenhum componente monta array de chave na mão. Os parâmetros da busca fazem parte da chave, então cada combinação de filtros tem seu próprio cache.
- **Isolamento por usuário.** Logout e troca de usuário chamam `queryClient.clear()`, que remove todo dado privado em cache.
- **Erro tipado.** `Register.defaultError` é `AppError` (`shared/api/query-types.ts`), porque toda falha passa pelo interceptor do Axios ou pelo `parseContract`.

### Atualização otimista (favoritos)

O coração dos cards e do detalhe usa `useFavorites` (`shared/favorites/`). Os favoritos ficam em `shared/` porque o catálogo e o detalhe são features diferentes.

- **`onMutate`:** cancela a busca em andamento, guarda a lista atual e aplica a mudança na hora.
- **`onError`:** restaura a lista guardada e mostra um aviso de erro acessível (toast com `aria-live`).
- **`onSuccess`:** sem toast, porque o coração já mostra o resultado. O sucesso é lido para leitores de tela pela região `aria-live` única do app (`announce()`, em `shared/lib/announce.ts`).
- **`onSettled`:** invalida a lista.

Um visitante que clica no coração vai para o login, com o retorno guardado. A falha da mutation e a recuperação são testadas com uma falha injetada (`failNextRequest`).

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
| `@axe-core/playwright` (dev)                               | Auditoria de acessibilidade automatizada nas telas principais.                                         |
| `lighthouse`, `chrome-launcher` (dev)                      | Auditorias de desempenho do `scripts/lighthouse.mjs`, com o Chromium do Playwright.                    |

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

- Exemplos: "Criadores" e "Aprenda" no header, os links de ajuda e redes sociais do rodapé, e a newsletter.
- O botão continua focável e tem `aria-disabled="true"`.
- O nome acessível ganha o sufixo "(indisponível nesta demonstração)".
- Ao ser acionado, mostra um aviso informativo em toast. Nunca mostra um aviso de sucesso.

### Decisões de navegação

- **Mercado:** no Figma, "Mercado" é a listagem do catálogo, que fica na própria Início. O link leva a `/#catalogo`.
- **Busca:** no desktop, o ícone de busca leva a `/#busca`. No mobile, a ação central da tab bar faz o mesmo. Há um campo na barra lateral e outro acima do hero (telas menores); o que estiver visível recebe o foco.
- **Coleções do rodapé:** cada link abre o catálogo já filtrado pela coleção (`/?collection=<slug>#catalogo`).
- **Sair:** no desktop, além do menu do perfil, um ícone "Sair da conta" fica no header ao lado do nome.
- **Busca no desktop:** o Figma desktop só mostra o ícone de busca no header. O campo fica no topo da barra lateral, e o ícone leva até ele e o foca. No mobile, o campo fica no topo, como no Figma.
- **Hero:** são 3 slides trocados pelos indicadores (clique ou setas). Não há rotação automática, porque ela exigiria um controle de pausa (WCAG 2.2.2) que o Figma não tem. O título muda de slide para slide, por isso o `h1` da página é oculto visualmente.
- **Listas do catálogo:** "Todos os NFTs / Novos lançamentos / Em alta" filtram a mesma lista. Por isso usam botões com `aria-pressed`, e não `role="tab"`, que exigiria painéis distintos.
- **Detalhe mobile:** a barra de compra fixa substitui a tab bar, como no frame `mobile-02`.
- **Lista de interesse (`/favoritos`):** o Figma não desenha essa tela, mas usa "Lista de interesse" com ícone de coração no menu do perfil e no rodapé, e um coração na tab bar mobile. Os três apontam para `/favoritos`, que lista `GET /favorites` com o mesmo card do catálogo e os estados de carregamento, vazio e erro.

## Desvios do Figma

| Onde                                      | Figma                                                               | Implementação                                                                                                                                                                                      | Motivo                                                    |
| ----------------------------------------- | ------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| Busca no desktop                          | Só o ícone no header                                                | Campo no topo da barra lateral; o ícone leva até ele e o foca                                                                                                                                      | A busca é um requisito e precisa de um campo              |
| Hero                                      | 1 slide desenhado com 3 indicadores                                 | 3 slides com textos do próprio Figma (desktop, mobile e banner)                                                                                                                                    | O conteúdo dos outros dois slides não foi desenhado       |
| Hero mobile                               | Texto curto                                                         | Mesmo slide, com a variante curta abaixo de `md`                                                                                                                                                   | Fidelidade aos dois frames                                |
| Detalhe: "Contrato" e "Direitos autorais" | Os textos dos dois rótulos aparecem trocados                        | Cada rótulo com o seu texto (endereço no contrato, percentual nos direitos)                                                                                                                        | Erro de conteúdo no layout                                |
| Detalhe: aba "Avaliações"                 | Não desenhada                                                       | Resumo da nota e da quantidade, avisando que os comentários não fazem parte da demonstração                                                                                                        | Não há conteúdo de avaliações no Figma nem na API         |
| Banner "Arte digital selecionada"         | Texto cortado no frame ("…que definem a")                           | Frase completa ("…a cultura da rede."); o banner cresce para não cortar                                                                                                                            | Conteúdo cortado no layout                                |
| Contagens da barra lateral                | 33, 12, 65…                                                         | Contagens reais dos 36 NFTs das fixtures                                                                                                                                                           | Os números do Figma são ilustrativos                      |
| Ordenação no mobile                       | Não aparece                                                         | "Ordenar por" visível também no mobile                                                                                                                                                             | A ordenação é um requisito em qualquer largura            |
| Card no mobile                            | Só o coração                                                        | Só o coração; carrinho e zoom ficam no detalhe                                                                                                                                                     | Fidelidade ao frame mobile                                |
| Preços                                    | "1.19", "0.016", "26.846"                                           | Mínimo de 2 e máximo de 3 casas decimais                                                                                                                                                           | Mesmo formato do layout para qualquer valor               |
| Estrelas                                  | 4 cheias para 4,8                                                   | Arredondamento para baixo                                                                                                                                                                          | Fidelidade ao frame                                       |
| Carrinho: "Colecionadores também viram"   | Carrossel abaixo da tabela                                          | Não implementado                                                                                                                                                                                   | Vitrine secundária, cortada por prioridade                |
| Pagamento desktop                         | Só os provedores em "Carteira e rede"                               | "Carteira cadastrada" (do frame mobile) acima dos provedores, mais conectar/desconectar                                                                                                            | O pedido precisa de uma carteira cadastrada e conectada   |
| Pagamento mobile                          | Só carteira, provedores e total                                     | Mesma ordem, seguida do resumo e do formulário do colecionador                                                                                                                                     | O formulário é obrigatório para o pedido                  |
| Resumo do pagamento                       | Itens fixos                                                         | "Deixar para depois" / "Incluir nesta compra" por item                                                                                                                                             | Compra parcial é um requisito                             |
| Recibo                                    | Sem linha de desconto                                               | Linha de desconto quando houve cupom; aviso de link simulado abaixo do Etherscan                                                                                                                   | O total precisa fechar; o link não é real                 |
| Fonte                                     | Textos vetorizados no export (nome da fonte não vem no arquivo)     | JetBrains Mono, servida localmente                                                                                                                                                                 | Glifos equivalentes; detalhes em "Substituição de assets" |
| Artes dos NFTs                            | 4 artes                                                             | As mesmas 4 artes reutilizadas pelos 36 NFTs das fixtures, com nomes diferentes                                                                                                                    | O layout também repete as artes                           |
| Telas mobile não desenhadas               | Só Início, detalhe, carrinho, pagamento, login e cadastro no mobile | Perfil vira lista de seções (`/perfil`) com `/perfil/dados` e `/perfil/carteiras`; favoritos, pedido (processando e recusado) e 404 seguem o grid e os componentes do mobile; recibo em tela cheia | Coerência com os frames que existem                       |
| Header desktop com sessão                 | Só o botão "Entrar" (visitante)                                     | Nome do colecionador (leva ao perfil) e ícone "Sair da conta"                                                                                                                                      | O estado logado não foi desenhado                         |
| Indicador de tempo real                   | Não desenhado                                                       | Aviso discreto só quando a conexão cai e quando volta                                                                                                                                              | Exigido pelo enunciado                                    |

## Desempenho

Medições e condições no [README](./README.md#auditorias-lighthouse). O que foi feito no build:

- **Code splitting por rota:** só a Início vem no carregamento inicial. Detalhe, carrinho, pagamento, pedido, perfil, carteiras, favoritos e os diálogos de login e cadastro são carregados sob demanda (`lazyRouteComponent`), com preload ao passar o mouse ou focar um link.
- **Entrada mínima:** o `main.tsx` só contém o bootstrap. React + app (`app/render.tsx`) e a API simulada são chunks separados, baixados em paralelo desde o início e pré-carregados pelo HTML (`<link rel="modulepreload">`, plugin em `vite.config.ts`).
- **Agrupamento:** as bibliotecas de base vão num chunk `vendor` e o código de `shared/` num chunk `shared`, em vez de dezenas de arquivos pequenos (cada um custa uma ida e volta em rede lenta).
- **Bundle dos mocks:** o MSW usa o `tough-cookie`, que traz a lista pública de sufixos de domínio (`tldts`, ~190 kB). A API simulada não usa cookies (a sessão é um token Bearer), então um substituto mínimo (`src/mocks/lib/tldts-lite.ts`) entra no lugar via alias. O chunk dos mocks caiu de ~177 kB para ~62 kB com gzip.
- **Imagens:** `-400.webp` nos cards e `-800.webp` no detalhe, sempre com `width`/`height`; `loading="lazy"` fora da dobra; `fetchpriority="high"` na imagem do hero e nos primeiros cards.
- **Fonte:** preload do peso 400 e `font-display: swap`.
- **Devtools do Query:** só em desenvolvimento, carregados sob demanda.

## Testes

- **E2E (`tests/e2e/`, um arquivo por fluxo):** rodam em Chromium desktop (1440×900) e mobile (390×844). Cada teste parte de um estado conhecido: banco do mock restaurado (`?reset=1`), cenário escolhido pela URL e armazenamento limpo (contexto novo por teste). Nenhum depende da ordem.
- **Controle do tempo:** latência e eventos vêm do cenário e de `window.__kurioMock`. A expiração de sessão e de cotação usa `page.clock` (o mock roda na página, então segue o mesmo relógio). Nenhum teste usa espera fixa.
- **Asserções:** observam a interface e o resultado (texto, URL, estado do pedido, banco do mock), com `getByRole`/`getByLabel`.
- **Acessibilidade:** `@axe-core/playwright` nas quatro telas principais, nos dois viewports; violação séria ou crítica falha o teste.
- **Regressão visual (`tests/visual/`):** Início, detalhe, carrinho e pagamento, nos dois viewports, contra o build de produção, com cenário fixo, relógio fixo, imagens e fontes locais e animações desligadas. Como a renderização de fonte muda de um sistema operacional para outro, as baselines têm o SO no nome (as atuais são de Windows) e rodam em um comando à parte (`pnpm test:visual`), fora do `pnpm test:e2e`.

## Limitações conhecidas

- **Mocks no navegador:** a API e o servidor Socket.IO vivem no service worker e na própria aba. Dados ficam no `localStorage` de cada navegador; outra aba compartilha o banco, mas não o relógio dos pedidos.
- **Desempenho no mobile:** a primeira renderização espera a API simulada subir (service worker + chunk dos mocks). Com uma API real, esse custo some; detalhes no README.
- **Listas e eventos de preço:** o card na lista recebe o preço novo, mas a página atual não se reordena nem refiltra (ordenação ou faixa por preço) até o próximo fetch.
- **Cookies no mock:** o substituto do `tldts` não reconhece sufixos públicos de vários níveis (ex.: `co.uk`); irrelevante, porque a API simulada não usa cookies.
- **Recibo:** a data usa o fuso do navegador; o hash e o link do Etherscan são fictícios e rotulados como tal.

## Ferramentas

- **pnpm fixado em 10.34.7** (campo `packageManager`). A linha 12 do pnpm é distribuída como binário nativo, que o corepack 0.31 (empacotado com o Node 22) não executa. A linha 10 segue mantida e funciona com qualquer corepack.
- **Node 22** (`.nvmrc` e `engines`), com mínimo de 22.12 exigido pelo Vite 8.

## Substituição de assets

- **Fonte:** o export do Figma vetorizou os textos, então o nome da fonte não está no arquivo. A comparação de glifos (zero pontilhado, `1` com base reta, caixa-alta geométrica) indica **JetBrains Mono**, servida localmente via `@fontsource/jetbrains-mono`.
  - Pesos: 400, 500 e 700, só no subconjunto `latin`, que cobre os acentos do português.
  - Carregamento: `font-display: swap`.
  - Preload: o peso 400 é pré-carregado por um plugin do Vite (`vite.config.ts`) que injeta a tag com o nome do arquivo já com hash.
- **Artes dos NFTs:** as 4 artes do Figma estão em `public/nfts/`, nas versões `-400.webp` (cards) e `-800.webp` (detalhe). Os PNGs originais de 1254px (~2 MB cada) não são usados na aplicação.
