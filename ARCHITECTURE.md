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
| Mocking              | MSW                                |
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
- **Interceptor de request:** anexa `Authorization: Bearer <token>` quando há sessão. O token é opaco, emitido pela API; nenhuma senha é guardada no cliente.
- **Interceptor de response:** converte qualquer falha em `AppError` (`code`, `status`, `details`, `fields`).
  - O envelope de erro da API (`{ error: { code, message, fields } }`) é validado com zod.
  - Sem envelope, o código é derivado do status HTTP.
  - Sem resposta, a falha vira `NETWORK_ERROR` ou `TIMEOUT`.
- **401 com sessão:** quando a request levava sessão, o interceptor emite o evento `session-expired` (`shared/api/session-events.ts`). Um 401 sem sessão, como no login, é só um erro comum para quem chamou.
- **Mensagens:** todas as mensagens em pt-BR ficam em um único mapa `code → mensagem`, em `shared/api/errors.ts`.

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

| Pacote                                                     | Por quê                                                                                             |
| ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `zod`                                                      | Contratos validados em runtime, com tipos derivados (`z.infer`); fonte única entre API, mocks e UI. |
| `react-hook-form` + `@hookform/resolvers`                  | Formulários performáticos, com validação pelo mesmo schema zod.                                     |
| `big.js`                                                   | Aritmética decimal exata para valores em ETH, que trafegam como string; `number` perderia precisão. |
| `zustand`                                                  | Estado de interface mínimo (drawer aberto, flags), fora do servidor e da URL.                       |
| `sonner`                                                   | Toasts acessíveis (`aria-live`) compatíveis com shadcn/ui.                                          |
| `lucide-react`                                             | Ícones em SVG com tree-shaking.                                                                     |
| `@fontsource/jetbrains-mono`                               | Fonte self-hosted; ver "Substituição de assets".                                                    |
| `@tanstack/react-query-devtools`                           | Inspeção do cache em desenvolvimento; carregado sob demanda e fora do build de produção.            |
| `eslint-plugin-boundaries`                                 | Garante no lint as fronteiras entre features, `shared` e `mocks`.                                   |
| `eslint-import-resolver-typescript`                        | Resolve o alias `@/` para o `eslint-plugin-boundaries`.                                             |
| `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh` | Regras de hooks e compatibilidade com HMR.                                                          |
| `prettier`                                                 | Formatação consistente.                                                                             |

## Ferramentas

- **pnpm fixado em 10.34.7** (campo `packageManager`). A linha 12 do pnpm é distribuída como binário nativo, que o corepack 0.31 (empacotado com o Node 22) não executa. A linha 10 segue mantida e funciona com qualquer corepack.
- **Node 22** (`.nvmrc` e `engines`), com mínimo de 22.12 exigido pelo Vite 8.

## Substituição de assets

- **Fonte:** o export do Figma vetorizou os textos, então o nome da fonte não está no arquivo. A comparação de glifos (zero pontilhado, `1` com base reta, caixa-alta geométrica) indica **JetBrains Mono**, servida localmente via `@fontsource/jetbrains-mono`. O token `--font-mono` já aponta para ela; o carregamento dos pesos 400/500/700 (com `font-display: swap` e preload do 400) entra junto com o design system.
