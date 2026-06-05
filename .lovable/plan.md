# Polimento dourado + Mobile 100%

Objetivo: aplicar refinamento estético sutil (hairlines dourados, sombras suaves, tipografia mais respirada) e garantir responsividade mobile completa em todas as telas do dashboard, sem mexer em regras de negócio.

## Princípios (valem pra todas as fases)

- **Estética**: hairline gradient dourado no topo de cards-chave, sombras suaves `shadow-[0_8px_24px_-12px_hsl(var(--primary)/0.25)]`, bordas `border-border/50`, mais respiro vertical, tipografia com `tracking-tight` em títulos.
- **Mobile**: nada de overflow horizontal, tabelas viram cards empilhados < 640px, modais viram bottom-sheet no mobile, grids `grid-cols-1 sm:grid-cols-2 lg:grid-cols-X`, padding `p-4 md:p-6`, fontes responsivas `text-xl md:text-2xl`, botões com altura mínima `h-11` no mobile (touch target).
- **Tokens semânticos**: só `primary`, `muted`, `border`, `card`, `foreground` etc. Zero cor hardcoded.

## Fase 1 — Chrome global + Dashboard
- `AppLayout`, `TopBar`, `AppSidebar` (mobile bottom nav), `NotificationPrompt`
- `pages/Dashboard.tsx` — KPIs em grid responsivo, gráficos com altura adaptativa

## Fase 2 — Operação diária
- `pages/Tasks.tsx` (Planilhas) — modal Nova Operação como bottom-sheet no mobile, tabela vira cards
- `pages/Operators.tsx`
- `pages/PixKeys.tsx`

## Fase 3 — Análise
- `pages/Networks.tsx`
- `pages/Reports.tsx`
- `pages/Goals.tsx`
- `pages/Costs.tsx`

## Fase 4 — Resto
- `pages/Subscription.tsx`, `pages/OperatorExtract.tsx`, `pages/Tutorial.tsx`, `pages/MasterPanel.tsx`, `pages/Quality.tsx`, `pages/Inventory.tsx`, `pages/Production.tsx`
- Componentes shared: `SubscriptionModal`, `SubscriptionCard`, `KPICard`, `DataTable`

## O que NÃO entra
- Mudanças funcionais, novas features, troca de libs
- Alteração de copy (só ajuste de hierarquia tipográfica)
- Refatoração de lógica de negócio

## Como vou trabalhar
Cada fase é um prompt seu. Eu entrego a fase, você confere no preview, e seguimos pra próxima. Assim você valida visualmente antes de eu avançar e nada quebra silenciosamente.
