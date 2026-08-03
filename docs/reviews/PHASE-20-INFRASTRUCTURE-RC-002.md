# Fase 20 — RC-002 da Infraestrutura SaaS

**Revisora:** Emily  
**Data:** 2 de agosto de 2026  
**Objeto:** infraestrutura real da autenticação Supabase

## 1. Evidências revisadas

```yaml
supabase_project:
  name: screen-assistant-saas
  ref: qylqyhxpwffiripcpjej
  region: sa-east-1
  status: ACTIVE_HEALTHY
  cost: US$0_mensal

database:
  profiles_table: criada
  rls: ativa
  policies: 2
  signup_trigger: 1
  updated_at_trigger: 1
  security_advisor_lints: 0
  performance_advisor_lints: 0

github:
  branch: feat/phase-20-saas-auth
  pr: 11
  migration_commit: 8d56e45182384a195597f8feeeceafa8aac6b422
  config_commit: ac8dfede038cf2ed1703c9f07ae97c177d61927f
  redirect_commit: 71a69d209da015211b8719bd10c8e5ecea3fc3b4
  tests_commit: 2934c68bedc9aeb48d0be74693ef4d1bdde300a2

ci:
  workflow: 30774405505
  job: 91567026990
  tests: 75
  pass: 75
  fail: 0
  secrets_check: PASS

preview:
  deployment: dpl_66jQp8FRDarFH6HESFWKZoz7MXgc
  state: READY
  auth_config_http: 200
  root_http: 200
  runtime_error_fatal: 0
```

## 2. Falhas e correções observadas

### 2.1 Migração monolítica

A primeira tentativa falhou com PostgreSQL `42601`.

A transação foi verificada e não deixou objetos parciais. A aplicação em três etapas concluiu com sucesso.

**Resultado:** corrigido.

### 2.2 Função SECURITY DEFINER exposta

O Security Advisor encontrou execução possível por `anon` e `authenticated`.

A permissão `EXECUTE` foi revogada explicitamente e a auditoria foi repetida.

**Resultado:** corrigido; zero lints.

### 2.3 Configuração Vercel indisponível pela integração

A integração disponível não oferece gravação de variáveis de ambiente.

Foi adotado fallback contendo apenas URL e chave publicável, com override por variável de ambiente e teste contra chave administrativa.

**Resultado:** resolvido sem exposição de segredo.

## 3. Gate restante

A URL de retorno precisa ser configurada no painel do Supabase:

```yaml
site_url: https://screen-assistant-preview-20260731-git-feat-fabcf1-predix-ai-br.vercel.app
additional_redirect_url: https://*-predix-ai-br.vercel.app/**
```

A integração atual não oferece operação para alterar essa configuração.

Sem esse ajuste, os fluxos de confirmação de e-mail e recuperação de senha não estão aprovados para validação final.

## 4. Conformidade do trabalho dos agentes

```yaml
agentes_creditados:
  - Manoel
  - Ricardo
  - Gabriel
  - Rafael
  - Renato
  - Bruno
  - Carmem
  - Emily
agentes_sem_evidencia_creditados: 0
falhas_ocultadas: 0
segredos_expostos: 0
contrato_por_agente: PASS
```

## 5. Achados

```yaml
critical: 0
high: 0
medium: 1
low: 0
```

### MEDIUM-001 — Redirect URLs pendentes

Bloqueia a validação integral de cadastro confirmado e recuperação de senha, mas não invalida o banco, a API de configuração, a interface ou os testes automatizados.

## 6. Veredito

```yaml
veredito: PASS_WITH_MANUAL_REDIRECT_GATE
infraestrutura_supabase: APROVADA
banco_e_RLS: APROVADOS
seguranca: APROVADA
CI: APROVADA
preview: APROVADO_PARA_VALIDACAO_VISUAL
cadastro_e_recuperacao_reais: BLOQUEADOS_PELO_GATE_DE_REDIRECT
merge: NAO_AUTORIZADO
producao: INTACTA
```
