# Fase 20 — Auditoria de Infraestrutura SaaS 001

**Data:** 2 de agosto de 2026  
**Projeto:** Screen Assistant  
**Autoridade:** Léo  
**Regra:** nenhum trabalho de agente pode ser silencioso

## 1. Contrato

```yaml
objetivo: ativar_autenticacao_SaaS_com_Supabase
projeto_supabase: screen-assistant-saas
project_ref: qylqyhxpwffiripcpjej
regiao: sa-east-1
custo: US$0_mensal
branch: feat/phase-20-saas-auth
pr: 11
merge: nao_autorizado
producao: intacta
```

## 2. Manoel — banco e autenticação

```yaml
entrada_recebida: autorizacao_de_criacao_com_custo_USD_0
consulta_ou_acao:
  - confirmar_custo
  - criar_projeto
  - aplicar_migracoes
  - validar_objetos
  - obter_URL_e_chave_publicavel
evidencia_obtida:
  project_ref: qylqyhxpwffiripcpjej
  project_status: ACTIVE_HEALTHY
  postgres: 17
  rls_enabled: true
  policy_count: 2
  signup_trigger_count: 1
  updated_trigger_count: 1
analise: infraestrutura_dedicada_e_isolamento_por_usuario_ativos
decisao: liberar_para_auditoria_de_seguranca
entrega: projeto_Supabase_e_esquema_SaaS
passagem_interna: Manoel_para_Ricardo
```

### Falha registrada

A primeira aplicação monolítica da migração falhou com PostgreSQL `42601` no corpo de uma função PL/pgSQL.

A inspeção posterior confirmou:

```yaml
profiles_exists: false
handle_new_user_exists: false
set_updated_at_exists: false
```

A transação não deixou objetos parciais.

A migração foi reaplicada em três etapas:

1. tabela e RLS;
2. perfil automático no cadastro;
3. atualização automática de `updated_at`.

Todas concluíram com sucesso.

## 3. Ricardo — segurança

```yaml
entrada_recebida: esquema_aplicado
consulta_ou_acao:
  - executar_Security_Advisor
  - corrigir_privilegios
  - repetir_Security_Advisor
  - executar_Performance_Advisor
evidencia_obtida:
  primeiro_security_advisor:
    warnings: 2
    causa: handle_new_user_executavel_por_anon_e_authenticated
  correcao: revoke_execute_explicito
  security_advisor_final: 0_lints
  performance_advisor_final: 0_lints
analise: funcao_do_trigger_preservada_sem_exposicao_RPC
decisao: SECURITY_PASS_e_PERFORMANCE_PASS
entrega: banco_sem_advertencias_dos_advisors
passagem_interna: Ricardo_para_Gabriel
```

## 4. Gabriel — versionamento

```yaml
entrada_recebida: diferencas_confirmadas_na_execucao_real
consulta_ou_acao:
  - atualizar_migracao_versionada
  - preservar_PR_Draft
  - registrar_evidencias
evidencia_obtida:
  migration_commit: 8d56e45182384a195597f8feeeceafa8aac6b422
  migration_content_sha: e93c5c99446f08c28a17fceec983bab9f77d198e
analise: arquivo_do_GitHub_agora_reflete_a_versao_funcional_e_endurecida
decisao: manter_sem_merge
entrega: migracao_reproduzivel
passagem_interna: Gabriel_para_Rafael
```

## 5. Rafael — integração do cliente e backend

```yaml
entrada_recebida:
  - Supabase_URL
  - chave_publicavel
  - requisito_de_redirect
consulta_ou_acao:
  - adicionar_fallback_publico_com_override_por_env
  - direcionar_confirmacao_de_cadastro_ao_dominio_atual
  - preservar_recuperacao_para_password_reset
evidencia_obtida:
  config_commit: ac8dfede038cf2ed1703c9f07ae97c177d61927f
  redirect_commit: 71a69d209da015211b8719bd10c8e5ecea3fc3b4
analise:
  - nenhuma_service_role_foi_obtida_ou_versionada
  - variaveis_de_ambiente_continuam_prioritarias
  - o_preview_nao_depende_de_escrita_de_env_pela_integracao
  - redirects_precisam_de_allowlist_no_Supabase
decisao: liberar_para_testes_com_gate_manual_de_URL
delivery: configuracao_publica_e_fluxos_de_email
passagem_interna: Rafael_para_Renato
```

## 6. Renato — testes e CI

```yaml
entrada_recebida:
  - migracao_endurecida
  - fallback_publico
  - redirects_de_email
consulta_ou_acao:
  - ampliar_testes
  - executar_CI
  - verificar_segredos
evidencia_obtida:
  fallback_test_commit: 881a2777b80281fd728cafbbcd7e38212bbd9608
  redirect_test_commit: 2934c68bedc9aeb48d0be74693ef4d1bdde300a2
  workflow: 30774405505
  job: 91567026990
  tests: 75
  pass: 75
  fail: 0
  secrets_check: PASS
analise: regressao_funcional_e_de_seguranca_aprovada
decisao: CI_PASS
entrega: evidencias_automatizadas
passagem_interna: Renato_para_Bruno
```

## 7. Bruno — preview e observabilidade

```yaml
entrada_recebida: HEAD_testado_2934c68
consulta_ou_acao:
  - localizar_deployment
  - validar_auth_config
  - consultar_logs
  - validar_raiz_HTTP
  - gerar_link_temporario
evidencia_obtida:
  deployment: dpl_66jQp8FRDarFH6HESFWKZoz7MXgc
  deployment_state: READY
  auth_config_http: 200
  root_http: 200
  runtime_error_fatal: 0
  branch_alias: screen-assistant-preview-20260731-git-feat-fabcf1-predix-ai-br.vercel.app
analise: preview_publicado_com_configuracao_Supabase_ativa
decisao: PREVIEW_READY_WITH_REDIRECT_GATE
entrega: preview_funcional_da_interface_SaaS
passagem_interna: Bruno_para_Emily
```

## 8. Gate externo restante

A integração disponível não permite alterar as configurações de Auth do Supabase.

É necessário configurar no painel Supabase:

```yaml
site_url: https://screen-assistant-preview-20260731-git-feat-fabcf1-predix-ai-br.vercel.app
additional_redirect_url: https://*-predix-ai-br.vercel.app/**
```

Sem essa allowlist, cadastro e recuperação podem enviar links para uma URL não autorizada ou para o Site URL padrão.

## 9. Estado auditado

```yaml
supabase_project: ACTIVE_HEALTHY
database_migrations: PASS
rls: PASS
security_advisor: PASS
performance_advisor: PASS
auth_config_endpoint: PASS
ci: PASS
preview: READY
email_redirect_allowlist: PENDENTE_MANUAL
merge: NAO_AUTORIZADO
production: INTACTA
```
