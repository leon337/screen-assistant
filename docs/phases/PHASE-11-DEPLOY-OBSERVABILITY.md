# Fase 11 — Deploy, observabilidade e feature flags

## Resultado

A fase foi implementada e validada localmente.

## Implementações

### Deploy

- configurações Wrangler separadas para local, preview e produção;
- observabilidade do Cloudflare habilitada nos arquivos de deploy;
- build do Pages com geração segura de `runtime-config.js`;
- workflow manual do GitHub Actions para Worker e Pages;
- guia com os campos exatos do painel Cloudflare Pages;
- configuração inicial segura em `AI_MODE=simulated`;
- runbook de rollback para Worker e Pages.

### Feature flags

- Gemini;
- GLM;
- fallback;
- observabilidade;
- circuit breaker.

O modo solicitado é reduzido com segurança quando um recurso é desabilitado. Nenhum provedor ativo produz erro controlado de configuração.

### Observabilidade

- logs JSON estruturados;
- `request.completed`;
- `provider.circuit`;
- `X-Request-ID`;
- `X-Release-ID`;
- `Server-Timing`;
- endpoint público `/ready` sem segredos.

Os logs não contêm screenshot, Base64, pergunta, resposta, token, e-mail, usuário ou IP original.

### Circuit breaker

- falhas elegíveis: timeout, rate limit e indisponibilidade;
- limite configurável de falhas;
- intervalo de abertura configurável;
- recuperação após nova chamada bem-sucedida;
- estado local por isolate;
- KV opcional para compartilhamento aproximado.

## Validação

```text
format:check   PASS
lint           PASS
typecheck      PASS
build          PASS
tests          PASS — 63/63
secrets:check  PASS
```

## Smoke test

```text
Frontend                         200
GET /health                      200
GET /ready                       200
POST autenticado simulado        200
CORS                             PASS
X-Request-ID                     PASS
X-Release-ID                     PASS
Server-Timing                    PASS
logs sem conteúdo                PASS
```

## Configuração do Pages observada nas capturas

A tela apresentada pelo usuário corresponde ao fluxo de importação por Git do Cloudflare Pages. O projeto deve estar primeiro em um repositório GitHub ou GitLab.

Campos:

```text
Project name: screen-assistant-web
Production branch: main
Framework preset: None
Root directory: vazio
Build command: npm run build:pages
Build output directory: apps/web/dist
```

## Limitações

- nenhum deploy foi executado na conta Cloudflare;
- nenhum repositório Git foi criado ou conectado nesta fase;
- credenciais reais do Supabase, Gemini e GLM não estavam disponíveis;
- circuit breaker sem KV permanece local ao isolate;
- validação externa deve começar em preview e modo simulado.

## Veredito

```text
PASS COM DEPLOY EXTERNO PENDENTE
```
