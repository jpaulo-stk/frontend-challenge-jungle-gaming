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
| MSW                                  | 3.0.3    |
| Playwright                           | 1.64.1   |
| ESLint                               | 10.13.0  |
