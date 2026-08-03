# Fase 20 — Autenticação SaaS

## Objetivo

Substituir o código único do piloto por contas individuais com e-mail e senha, preparando o Screen Assistant para operar como plataforma SaaS.

## Escopo implementado

- cadastro com nome, e-mail e senha;
- login com e-mail e senha;
- confirmação de e-mail quando configurada no Supabase;
- recuperação de senha;
- definição de nova senha;
- persistência e renovação da sessão;
- logout;
- aplicação oculta até autenticação;
- API de análise protegida por usuário autenticado;
- rate limit por usuário e IP;
- perfil básico com plano `free`;
- políticas Row Level Security;
- criação automática do perfil após cadastro;
- remoção do `PREVIEW_ACCESS_TOKEN` do fluxo da aplicação.

## Arquitetura

```text
Navegador
  ├─ tela de login/cadastro
  ├─ Supabase Auth: senha e sessão
  └─ API Screen Assistant: JWT do usuário
          ├─ validação em /auth/v1/user
          ├─ rate limit por usuário
          └─ Gemini
```

A senha é enviada diretamente ao Supabase Auth. O backend do Screen Assistant recebe somente o token de sessão.

## Componentes

### Cliente

- `public/auth-v20.js`
- `public/auth-v20-ui.js`
- `public/auth-v20.css`
- `public/design.js`
- `public/analysis.js`

### Backend

- `api/v1/auth-config.js`
- `api/v1/analyze-screen.js`
- `src/server/auth.js`
- `src/server/config.js`

### Banco

- `supabase/migrations/20260802210000_create_saas_profiles.sql`

### Testes

- `tests/phase20-saas-auth.test.js`

## Variáveis necessárias

```env
SUPABASE_URL=https://SEU_PROJETO.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
AI_MODE=gemini
GEMINI_API_KEY=...
```

A chave publicável pode ser entregue ao navegador. Chaves administrativas ou `service_role` não podem aparecer no cliente.

## Modelo inicial

```yaml
profiles:
  id: auth.users.id
  display_name: texto
  plan: free_ou_pro
  analysis_count: inteiro
  created_at: data_hora
  updated_at: data_hora
```

O campo `plan` apenas prepara a arquitetura. Nenhuma cobrança ou plano pago foi ativado nesta fase.

## Limites desta fase

- sem cobrança real;
- sem Stripe ou outro provedor de pagamento;
- sem organizações ou equipes;
- sem painel administrativo completo;
- sem histórico persistente de análises;
- sem aplicação da migração até existir projeto Supabase escolhido ou criado;
- sem merge;
- sem deploy de produção.

## Gate de infraestrutura

Os projetos Supabase existentes estão inativos e associados a produtos anteriores. A ativação exige uma decisão explícita entre:

1. criar um projeto dedicado `screen-assistant-saas`;
2. selecionar conscientemente um projeto existente.

Até esse gate ser resolvido, o código e os testes podem ser concluídos, mas o login real não pode funcionar em preview.
