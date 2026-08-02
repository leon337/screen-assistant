# PHASE-19-DEC-001 — Adotar Leonardo Trader V2

## Estado

`APROVADA_PARA_PLANEJAMENTO`

## Contexto

Léo forneceu o Prompt Mestre completo do Robô Trader Mentor, definindo identidade, missão, personalidade, princípios, dados necessários, análise multitemporal, elementos técnicos, construção de cenários, entrada educacional hipotética, gestão de risco, método de ensino, formato completo e primeira mensagem.

O texto passa a ser a fonte oficial de requisitos do perfil Trader.

## Decisão

Adotar o nome público **Leonardo Trader** e implementar o comportamento em arquitetura modular.

### Distinção de identidade

- `Leonardo`: agente metodológico interno do MCF, responsável por produto, planejamento e requisitos;
- `Leonardo Trader`: perfil especializado do Screen Assistant voltado ao usuário final.

Os dois nomes devem permanecer qualificados nos registros para evitar ambiguidade.

## Adaptações aprovadas

### 1. Primeira mensagem

A apresentação completa aparece somente no primeiro uso do perfil ou quando o usuário solicitar reapresentação.

### 2. Formato de 11 seções

O formato completo fornecido por Léo é obrigatório no modo `complete_analysis` ou `detailed`.

Nos modos rápidos, usar contratos menores para preservar a experiência mobile.

### 3. Possível entrada

Usar sempre a expressão `entrada educacional hipotética`, condicionada a região, gatilho, invalidação e dados suficientes.

Nunca emitir ordem direta.

### 4. Qualidade do cenário

`baixa`, `moderada` ou `alta` representa coerência estrutural observável. Não representa probabilidade, taxa de acerto ou garantia.

### 5. Risco

O agente ensina princípios de risco, mas não incentiva dinheiro real, alavancagem, recuperação de perdas ou execução automática.

### 6. Resposta estruturada

A implementação deverá separar:

```text
política base
→ perfil
→ tarefa
→ contexto
→ contrato de resposta
→ pergunta
```

## Modos oficiais

- `onboarding`;
- `quick_read`;
- `complete_analysis`;
- `map_scenarios`;
- `validate_setup`;
- `explain_indicators`;
- `build_checklist`.

## Artefatos normativos

- `docs/prompts/TRADER-AGENT-V2-MASTER-PROMPT.md`;
- `docs/prompts/TRADER-AGENT-V2-RESPONSE-CONTRACTS.md`.

## Bloqueios

Antes da implementação:

1. consolidar a branch de perfis especialistas;
2. decidir qual proposta da Fase 18 será base visual;
3. desenhar a tela de seleção por intenção;
4. definir validação da saída estruturada;
5. criar testes do perfil e de segurança.

## Autorizações

```yaml
planejamento: autorizado
documentacao: autorizada
implementacao: nao_autorizada
merge: nao_autorizado
deploy: nao_autorizado
operacao_financeira_real: proibida
```
