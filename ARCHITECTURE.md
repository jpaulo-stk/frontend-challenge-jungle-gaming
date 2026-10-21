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
| `radix-ui`                                                 | Primitivos acessíveis (foco preso, teclado, ARIA) por trás dos componentes shadcn/ui.               |
| `class-variance-authority`                                 | Variantes tipadas dos componentes (botão, badge, stepper).                                          |
| `cn`                                                       | Junção de classes com resolução de conflitos do Tailwind, usada pelos componentes shadcn/ui.        |
| `vaul`                                                     | Drawer inferior com gesto de arrastar, base do `drawer` do shadcn/ui no mobile.                     |
| `shadcn`, `tw-animate-css` (dev)                           | CLI que gera os componentes e as variantes/animações de CSS que eles usam; só atuam no build.       |

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
