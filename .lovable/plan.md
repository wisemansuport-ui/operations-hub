# Atualizar o site hospedado no Vercel

## Situação atual

O projeto já tem tudo o que é necessário para deploy automático no Vercel:

- `.github/workflows/deploy.yml` — workflow que roda a cada `push` para a branch `main`, faz `npm ci`, `npm run build` e publica no Vercel com `--prod`.
- `vercel.json` — rewrites de SPA configurados.
- Integração bidirecional Lovable ↔ GitHub: toda mudança feita no Lovable é enviada para o GitHub automaticamente.

Ou seja, o caminho para atualizar o site real do Vercel é:

```text
Lovable (edição) ──► GitHub (push em main) ──► GitHub Actions ──► Vercel (--prod)
```

## O que precisa acontecer

### 1. Confirmar que o GitHub está conectado
No menu `+` do chat do Lovable → **GitHub** → o projeto deve aparecer como conectado a um repositório. Se ainda não estiver, conectar e criar o repositório — isso envia todo o código atual para a branch `main` de uma vez.

### 2. Confirmar os secrets no GitHub
O workflow exige estes 3 secrets no repositório (Settings → Secrets and variables → Actions):

- `VERCEL_TOKEN` — token pessoal gerado em https://vercel.com/account/tokens
- `VERCEL_ORG_ID` — ID da org/conta Vercel
- `VERCEL_PROJECT_ID` — ID do projeto Vercel já existente

Se algum estiver faltando, o Actions vai falhar na etapa “Deploy to Vercel”. Os IDs podem ser obtidos rodando `vercel link` localmente uma vez (gera `.vercel/project.json`) ou no painel do Vercel em Project Settings → General.

### 3. Disparar o deploy
Assim que houver qualquer commit novo na `main` (qualquer edição feita aqui no Lovable serve), o workflow roda e atualiza o site Vercel automaticamente. Não é necessário rodar nada manual.

Se você quiser forçar um deploy sem mudar código, dá pra ir em **GitHub → Actions → Deploy to Vercel → Run workflow** (precisa adicionar `workflow_dispatch:` no `on:` do yml — posso fazer isso se quiser um botão de “republicar” manual).

## O que eu posso fazer agora (em build mode)

Confirme qual destes você quer e eu executo:

1. **Adicionar `workflow_dispatch`** ao `deploy.yml` para você poder disparar deploys manualmente pelo GitHub sem precisar commitar nada.
2. **Fazer um commit trivial** (ex.: bump em um comentário no `main.tsx`) só para acionar o workflow agora e atualizar o Vercel imediatamente.
3. **Ambos.**

Se o problema for que o deploy está falhando (secrets faltando, projeto Vercel não criado, etc.), me diga o erro que aparece na aba **Actions** do GitHub que eu corrijo o workflow de acordo.

## Detalhes técnicos

- Action usada: `amondnet/vercel-action@v25` com `--prod`, ou seja, vai direto para produção (não preview).
- Build roda com Node 20 e `npm ci` — `package-lock.json` precisa estar versionado, senão `npm ci` falha.
- `vercel.json` só tem rewrites de SPA; nenhuma config de build é necessária porque o artefato (`dist/`) é gerado pelo workflow antes do upload.
- O Lovable não tem acesso ao painel do Vercel nem ao GitHub Actions — então não consigo ver logs de falha de deploy daqui. Se precisar debugar, cole o log da run do Actions.
