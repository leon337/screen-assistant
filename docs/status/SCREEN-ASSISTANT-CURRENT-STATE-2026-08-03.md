# Screen Assistant — Estado atual do projeto

**Data:** 3 de agosto de 2026  
**Branch:** `feat/phase-21-design-experience`  
**PR:** #12  
**Estado de governança:** Draft, sem merge e sem alteração de produção.

## Resumo executivo

O Screen Assistant evoluiu de um piloto protegido por código para uma plataforma SaaS autenticada com Supabase.

O usuário já conseguiu:

- abrir a tela de login;
- criar ou acessar uma conta;
- entrar na aplicação;
- selecionar imagem;
- escolher análise de gráfico;
- usar o Leonardo Trader;
- receber uma análise estruturada.

A infraestrutura de autenticação, banco, RLS, sessão e análise está operacional no ambiente de preview.

## Estado por área

### Autenticação SaaS

```yaml
supabase_project: screen-assistant-saas
project_ref: qylqyhxpwffiripcpjej
status: ACTIVE_HEALTHY
login: operacional
cadastro: implementado
recuperacao_de_senha: implementada
RLS: ativa
merge: nao_realizado
```

### Agentes

Perfis disponíveis:

- Assistente geral;
- Engenheiro de Software / diagnóstico técnico;
- Arquiteto de Software;
- especialista em UX e interface;
- Leonardo Trader.

O Leonardo Trader possui contrato educacional próprio, cenários condicionais e gestão de risco. A análise não executa ordens e não promete resultados.

### Experiência de resultado

A tela de resultado mobile recebeu correções para:

- remover cabeçalho e navegação que cobriam conteúdo;
- reduzir cartões aninhados;
- ocultar metadados técnicos;
- compactar ações;
- melhorar a largura útil da resposta.

A experiência ainda depende de validação contínua no aparelho real.

### Primeira tela

A primeira tela atual ainda apresenta excesso de elementos:

- ações repetidas de Foto e Galeria;
- barra inferior redundante;
- cabeçalho com muitas ações;
- objetivos em cartões grandes;
- escolha de especialista excessivamente exposta;
- onboarding do Leonardo Trader dentro do formulário.

## Fase 22A — decisão atual

Foi aprovada documentalmente uma nova jornada:

```text
Enviar imagem
→ escolher intenção
→ receber especialista sugerido
→ analisar
```

A escolha manual do agente deixa de ser etapa obrigatória.

O sistema mostrará o especialista como consequência da intenção:

```text
Especialista sugerido: Leonardo Trader
[Trocar]
```

### Estado do wireframe

```yaml
wireframe: APROVADO
RC: PASS_WITH_IMPLEMENTATION_GATES
implementacao_da_nova_tela: NAO_INICIADA
preview_da_nova_tela: NAO_DISPONIVEL
merge: NAO_AUTORIZADO
```

Artefatos:

- `docs/wireframes/PHASE-22A-FIRST-SCREEN-WIREFRAME.md`;
- `docs/reviews/PHASE-22A-FIRST-SCREEN-WIREFRAME-RC-002.md`.

## Incidente de continuidade — HTTP 422

Durante o fluxo da Fase 22A, houve uma tentativa incorreta de criar um novo pull request para a branch `feat/phase-21-design-experience`.

O GitHub rejeitou a ação porque o PR #12 já existia.

```yaml
erro: HTTP_422
causa: pull_request_ja_existente_para_a_branch
novo_PR_criado: false
branch_alterada: false
merge_realizado: false
efeito_no_codigo: nenhum
recuperacao: reutilizar_PR_12
resultado: fluxo_continuou
```

O incidente não alterou código, branch, produção ou governança. A recuperação correta foi manter o PR #12 e publicar os novos artefatos nele.

## Mecanismo criado após o incidente

Foi criado no repositório MCF o **Protocolo CAF — Continuidade Automática de Fluxo**.

O protocolo determina:

```text
CAPTURAR
→ CLASSIFICAR
→ VERIFICAR EFEITO
→ ESCOLHER RECUPERAÇÃO
→ EXECUTAR
→ VALIDAR
→ CONTINUAR
```

Ele inclui:

- classes de falha;
- checkpoint obrigatório do bastão;
- agente substituto;
- limite de tentativas;
- proibição de destinatário `ENCERRADO`;
- proibição de encerrar com ação pendente;
- schema JSON validável.

Referência:

- MCF PR #27 — `MCF-DEC-016 — fluxo resiliente e continuidade automática`.

## Testes e CI antes desta atualização documental

```yaml
workflow: 30780050991
job: 91582767846
testes: 91
aprovados: 91
falhas: 0
segredos: PASS
```

## Próxima etapa técnica

Implementar o wireframe da Fase 22A na branch atual, com:

1. estado inicial contendo somente Foto e Galeria;
2. objetivos revelados após selecionar imagem;
3. especialista sugerido automaticamente;
4. troca manual opcional;
5. reset completo em Nova análise;
6. preservação explícita em Repetir análise;
7. testes de compatibilidade entre intenção, perfil e tarefa;
8. preview mobile;
9. RC-003 antes de qualquer merge.

## Checkpoint CAF do projeto

```yaml
objetivo: SCREEN-PHASE-22A-FIRST-SCREEN
estado: EM_EXECUCAO
ultimo_sucesso: wireframe_e_RC_002_versionados
falha_atual: nenhuma
classe_da_falha: NENHUMA
efeito_confirmado: incidente_422_sem_efeito_residual
recuperacao_escolhida: nenhuma
proxima_acao: implementar_wireframe_na_branch
destinatario: Rafael
artefatos:
  - tipo: arquivo
    referencia: docs/wireframes/PHASE-22A-FIRST-SCREEN-WIREFRAME.md
  - tipo: parecer
    referencia: docs/reviews/PHASE-22A-FIRST-SCREEN-WIREFRAME-RC-002.md
  - tipo: pull_request
    referencia: https://github.com/leon337/screen-assistant/pull/12
```

## Governança

```yaml
PR_12: aberto_Draft
merge: NAO_AUTORIZADO
producao: INTACTA
implementacao_Fase_22A: proxima_acao
```
