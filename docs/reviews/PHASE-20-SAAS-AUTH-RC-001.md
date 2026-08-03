# PHASE-20 — RC-001 — Autenticação SaaS

## Objeto

Revisão crítica da substituição do código único do piloto por autenticação individual com Supabase Auth.

## Escopo auditado

- cadastro, login, recuperação e redefinição de senha;
- persistência, renovação e encerramento de sessão;
- bloqueio visual da aplicação antes da autenticação;
- envio do JWT do usuário para a API;
- validação do JWT no Supabase Auth;
- rate limit por usuário e IP;
- endpoint público de configuração;
- perfis com RLS;
- PWA;
- remoção do acesso por código;
- regressão da Fase 19 e do Leonardo Trader;
- estado do preview.

## Evidências

```yaml
branch: feat/phase-20-saas-auth
head_revisado: 2d9ed0836c718ad297dd6bd413f13fa144c07ed0
pr: 11
ci_workflow: 30773744236
ci_job: 91565274186
tests: 72
pass: 72
fail: 0
secrets_check: PASS
vercel_deployment: dpl_2Evd8ops9qFFGFNTQXPkVUCh2NV5
vercel_state: READY
auth_config_endpoint: 503_AUTH_CONFIG
```

## Achados aprovados

1. Senhas são enviadas diretamente ao Supabase Auth e não passam pelo backend do Screen Assistant.
2. O navegador recebe apenas configuração publicável.
3. A API valida o token no endpoint de usuário do Supabase antes de executar a análise.
4. O rate limit considera usuário e IP.
5. A migração cria `profiles` sem armazenar senha.
6. RLS restringe leitura e atualização ao próprio usuário.
7. O código único do piloto foi removido do fluxo oficial.
8. A Fase 19 e o Leonardo Trader permaneceram cobertos pela regressão.
9. A suíte concluiu 72 testes aprovados e nenhuma falha.
10. A verificação básica de segredos foi aprovada.

## Pendências

### Medium 1 — Projeto Supabase não selecionado

Os projetos existentes estão inativos e associados a outros produtos ou nomes genéricos. Nenhum deve ser reutilizado sem decisão explícita.

### Medium 2 — Infraestrutura não aplicada

Ainda faltam:

- projeto Supabase escolhido ou criado;
- migração aplicada;
- `SUPABASE_URL` configurada na Vercel;
- `SUPABASE_PUBLISHABLE_KEY` configurada na Vercel;
- URLs de redirecionamento autorizadas no Supabase.

O endpoint `/api/v1/auth-config` respondeu `503 AUTH_CONFIG`, conforme esperado enquanto o ambiente não está configurado.

### Low 1 — E-mails reais não validados

Os fluxos de confirmação de cadastro e recuperação de senha dependem da configuração real do projeto Supabase e deverão ser testados no preview após a infraestrutura ser conectada.

## Contagem

```yaml
critical: 0
high: 0
medium: 2
low: 1
```

## Veredito

```text
PASS_WITH_INFRASTRUCTURE_GATE
```

A implementação de código está aprovada para continuidade. O login real, o cadastro real e a recuperação real permanecem bloqueados até a conclusão do gate de infraestrutura.

## Governança

- PR permanece Draft;
- merge não autorizado;
- deploy de produção não autorizado;
- cobrança não implementada;
- produção intacta.
