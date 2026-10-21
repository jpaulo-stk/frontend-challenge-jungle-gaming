# Design tokens — Kurio (medidos no export do Figma)

Tudo abaixo foi extraído do SVG original (coordenadas exatas) ou medido nos renders 1x.
Quando precisar de um número que não está aqui, **meça no `screens/*.svg`** em vez de estimar.

---

## 1. Cores

Contagem de uso no arquivo entre parênteses — serve para identificar o papel real de cada cor.

| Token | Hex | Uso |
|---|---|---|
| `--bg` | `#140D0A` (82×) | Fundo de página, texto sobre botão primário |
| `--surface` | `#241612` (89×) | Cards, painéis, inputs, linhas de tabela |
| `--surface-2` | `#2F1D15` (27×) | Hover, elevação, chips |
| `--surface-3` | `#38220F` (17×) | Faixa do rodapé, badge de carteiras compatíveis |
| `--border` | `#3F2319` (112×) | Borda padrão (stroke 1.5) |
| `--border-strong` | `#55321F` (27×) | Borda de destaque / divisores |
| `--primary` | `#D28A4C` (171× fill, 114× stroke) | Botão primário, bordas ativas, ícones, paginação ativa |
| `--primary-hi` | `#E89B55` (140×) | Preço, link ativo, ênfase, ícone de favorito |
| `--primary-alt` | `#E3A44E` | Variação de gradiente do botão |
| `--text` | `#F5F1EB` (422×) | Texto principal |
| `--text-muted` | `#CFB28C` (164×) | Texto secundário, descrições |
| `--text-dim` | `#B39463` (88× fill, 39× stroke) | Placeholder, metadados, labels desativados |
| `--danger` | `#F0805F` (38×) | Alertas, cursor, asterisco de campo obrigatório |
| `--success` | `#00A66C` / `#59C36A` | Estados positivos e ícones |

Cores de marca presentes apenas em ícones sociais/login: `#4086F4`, `#3B5999`, `#FFDA2D`, `#FF641A`, `#4175DF`.

Gradiente do card "NFT em destaque" e de alguns botões: linear de `--primary` para `--primary-alt`, vertical.

```css
/* globals.css — Tailwind v4 */
@theme {
  --color-bg: #140D0A;
  --color-surface: #241612;
  --color-surface-2: #2F1D15;
  --color-surface-3: #38220F;
  --color-border: #3F2319;
  --color-border-strong: #55321F;
  --color-primary: #D28A4C;
  --color-primary-hi: #E89B55;
  --color-text: #F5F1EB;
  --color-text-muted: #CFB28C;
  --color-text-dim: #B39463;
  --color-danger: #F0805F;
  --color-success: #00A66C;
  --font-mono: "JetBrains Mono", ui-monospace, monospace;
  --radius-sm: 4px;  --radius-md: 6px;  --radius-lg: 8px;  --radius-xl: 16px;
}
```

**Contraste:** `--text-dim` (#B39463) sobre `--surface` (#241612) dá ~5.9:1 — passa em AA para texto normal. `--primary` sobre `--bg` dá ~7:1. O texto escuro sobre botão primário usa `--bg`, não preto puro. Verifique qualquer combinação nova antes de usar; a meta de Accessibility é ≥95.

---

## 2. Tipografia

Os textos foram vetorizados no export, então o nome da fonte não está no arquivo. A comparação de glifos (zero pontilhado, `1` com base reta, caixa-alta geométrica sem serifa) indica **JetBrains Mono**. Use-a e documente a substituição.

Valores medidos nos renders 1x (altura de ink e avanço monoespaçado):

| Papel | Tamanho | Line-height | Peso | Cor |
|---|---|---|---|---|
| H1 hero (desktop) | 43px | 70px | 700 | `--text` |
| H1 hero (mobile) | 26–28px | 40px | 700 | `--text` |
| H1 de página / nome do NFT (detalhe) | 28px | 44px | 700 | `--text` |
| Título de seção ("Coleções", "Resumo da carteira") | 18px | 28px | 700 | `--text` |
| Título de card / preço no card | 16px | 28px | 400 / 700 no preço | `--text` / `--primary-hi` |
| Corpo | 14px | 24px | 400 | `--text-muted` |
| Nav e rótulos | 15–16px | 24px | 400 | `--text` (ativo: `--primary-hi` + sublinhado) |
| Metadados / placeholder | 13–14px | 20px | 400 | `--text-dim` |
| Logo "KURIO" | 14px | — | 700 | `--text`, `letter-spacing: 0.18em` |
| Botão | 15–16px | — | 700 | `--bg` sobre `--primary` |

Tolerância aceitável: ±1px. Se a regressão visual acusar diferença maior, ajuste o tamanho, não o baseline.

---

## 3. Geometria

**Grid desktop (frame 1440):** container 1200px centralizado → margem lateral 120px.

| Bloco | Medida exata |
|---|---|
| Header | altura 72px, logo em x=120, nav centralizada, ações à direita; borda inferior 1px `--border` |
| Hero | área 1200×527 a partir de y=30; arte à direita 316×316 com raio 16 |
| Sidebar de filtros | 310×785 em x=120, y=653 |
| Gutter sidebar → grid | 48px (sidebar termina em 430, grid começa em 478) |
| Card do catálogo | 258×300, imagem interna 250×250 (ou 224×286 no destaque) |
| Grid do catálogo | 3 colunas, passo 292px → gap 34px |
| Card "NFT em destaque" | 310×470 em x=120, y=1462, fundo em gradiente |
| Card de carrossel (relacionados) | 219×255, passo 245px → gap 26px |
| Linha de item do carrinho | 782×70 (desktop), avatar 56×56 raio 6 |
| Linha de item do resumo (pagamento) | 405×70 |
| Rodapé | três faixas de 1200px: benefícios 250, barra de contato 88 (`--surface-3`), links 236 + copyright |
| Modal de login/cadastro | 500×600 (login) e 500×656 (cadastro), centralizado, overlay escurecido |
| Modal de confirmação de pedido | 578×821, raio 8, barra inferior de 10px em `--primary` |

**Mobile (frame 414×896 no Figma — implemente fluido a partir de 360):**

| Bloco | Medida |
|---|---|
| Padding lateral | 20px |
| Busca + botão de filtro | altura 56, raio 16; botão 56×56 |
| Card do catálogo | layout masonry de 2 colunas, gap 12, raio 12 |
| Tab bar inferior | altura 72, fixa, 4 ícones + FAB central de 56px sobreposto |
| Barra de ação do detalhe | fixa no rodapé: stepper + preço em cima, botão "Comprar NFT" (pill) + botão de carrinho 56×56 |
| Linha do carrinho | card 374×96, thumb 76×76 raio 8 |

**Raios:** 4 (chips, badges) · 6 (inputs, thumbs) · 8 (cards, modais) · 16 (hero, busca mobile) · 999 (botões pill do mobile, stepper, avatares).

**Bordas:** 1.5px é o padrão (`stroke-width="1.5"` domina o arquivo). Divisores finos usam 1px `--border`.

**Sombras:** o layout não usa sombra. Elevação é feita por `--surface-2` e borda.

---

## 4. Componentes recorrentes

- **Botão primário:** fundo `--primary` (ou gradiente), texto `--bg`, peso 700, raio 6 no desktop / pill no mobile, altura 44–48 desktop e 56 mobile.
- **Botão secundário:** fundo transparente, borda 1.5 `--primary`, texto `--text`.
- **Input:** fundo `--surface`, borda 1.5 `--border`, raio 6, altura 44 (desktop) / 56 (mobile), placeholder `--text-dim`; foco troca a borda para `--primary` + anel externo.
- **Campo obrigatório:** label + asterisco `--danger`.
- **Stepper de quantidade:** dois botões circulares 32px `--primary` com número ao centro; desabilita no limite de edição.
- **Chip de edição ("1/1", "1/10", "1/50", "ABERTA"):** pill com borda 1.5; selecionado ganha borda `--primary` e texto `--text`.
- **Badge "RARO":** retângulo `--primary`, texto `--bg`, canto superior esquerdo do card, raio 4 — e um texto acessível junto (não dependa só da cor).
- **Card de NFT:** imagem com raio 8, título 16px, preço `--primary-hi`; preço antigo riscado em `--text-dim`. No hover aparece a barra de ações (carrinho / favorito / zoom) sobre a imagem — ela também precisa ser alcançável por teclado.
- **Paginação:** quadrados 32×32 raio 4, ativo com fundo `--primary` e texto `--bg`.
- **Skeleton:** mesma caixa do conteúdo real (preserve dimensões), fundo `--surface`, shimmer de `--surface-2` → `--surface`, desativado sob `prefers-reduced-motion`.

---

## 5. Inventário das telas

| Arquivo | Tela | Observações |
|---|---|---|
| `desktop-01-inicio` | Início | Hero com carrossel (3 dots), sidebar de coleções/preço/rede, abas "Todos os NFTs / Novos lançamentos / Em alta", ordenação, grid, paginação (1–4), banners, seção editorial, rodapé |
| `desktop-02-nft-detalhe` | Detalhe | Galeria com 4 thumbs + zoom, avaliações, chips de edição, stepper, Comprar/Favoritar, abas Detalhes/Avaliações, carrossel relacionados |
| `desktop-03-carrinho` | Carrinho | Tabela de itens com stepper e remoção, cupom, subtotal/desconto/taxa/total, "Conectar e finalizar" |
| `desktop-04-pagamento` | Pagamento | Formulário do colecionador (11 campos), resumo com itens e totais, seleção de carteira (3 opções), "Confirmar compra" |
| `desktop-05-confirmacao-pedido` | Confirmação | Modal com ID da transação, data, total, carteira, itens, taxa, total e "Ver no Etherscan" (link simulado) |
| `desktop-06-login` | Login | Modal 500×600 sobre a Início, abas Entrar/Criar conta, social login, "Esqueceu a senha" |
| `desktop-07-cadastro` | Cadastro | Mesmo modal, 4 campos + confirmação de senha |
| `desktop-08-perfil` | Perfil | Menu lateral (8 itens, "Sair" destacado), dados do perfil, avatar (Alterar/Remover), alteração de senha |
| `desktop-09-carteiras` | Carteiras | Carteira principal (8 campos) + carteira secundária com estado vazio |
| `mobile-01-inicio` | Início mobile | Busca + filtro, hero compacto, abas, grid masonry 2 colunas, tab bar + FAB |
| `mobile-02-nft-detalhe` | Detalhe mobile | Imagem cheia, voltar/favoritar sobrepostos, bloco de infos, barra de ação fixa |
| `mobile-03-carrinho` | Carrinho mobile | Cards de item, bloco de resumo fixo com cupom e total |
| `mobile-04-pagamento-carteira` | Pagamento mobile | Carteiras cadastradas (principal/reserva) + provedores + total + confirmar |
| `mobile-05-login` | Login mobile | Tela cheia com logo |
| `mobile-06-cadastro` | Cadastro mobile | Tela cheia com 4 campos |

Telas que o enunciado exige em mobile mas o Figma não desenhou: **perfil, carteiras e confirmação de pedido**. Adapte mantendo o mesmo padrão (menu lateral vira lista navegável; modal de confirmação vira tela cheia).

---

## 6. Assets

`assets/nft-01..04.png` são as únicas 4 artes do arquivo (1254×1254). O catálogo do Figma as reaproveita com nomes diferentes.

Para a aplicação use as versões `-800.webp` (detalhe/hero) e `-400.webp` (cards). O PNG original só serve de fallback ou fonte de reprocessamento — 2MB por imagem derruba o LCP e a meta de performance.

Fixture precisa de mais variedade do que 4 imagens: reutilize as 4 com nomes e atributos distintos (é o que o próprio layout faz) e registre essa limitação no README.
