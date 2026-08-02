# RC-001 — Fase 19 UX e prompts de agentes

## Escopo revisado

- diagnóstico visual das capturas mobile;
- jornada proposta em três etapas;
- separação entre jornada do usuário e estado operacional;
- arquitetura de prompts por política, perfil, tarefa e contrato;
- especificação inicial do Agente Trader;
- limites de segurança;
- estado das branches existentes.

## Resultado

```yaml
veredito: PASS_WITH_REQUIRED_INPUT
critical: 0
high: 0
medium: 2
low: 0
```

## Achados médios

### M-01 — Requisitos específicos do Trader pendentes

A especificação define modos gerais, mas Léo ainda precisa informar quais regras, leituras, confirmações e formatos deseja que o Trader execute.

### M-02 — Consolidação técnica pendente

Existem branches à frente da `main` para perfis especialistas e duas propostas de Fase 18. A implementação da Fase 19 deve começar somente após escolher a base técnica correta e evitar sobreposição de mudanças.

## Pontos aprovados

- fluxo orientado por intenção;
- remoção do estado operacional da jornada principal;
- barra móvel contextual;
- resultado progressivo;
- política-base sem títulos obrigatórios;
- contratos por tarefa;
- limites do Trader;
- manutenção de merge e deploy bloqueados.

## Gate

```yaml
implementacao: bloqueada
aguarda:
  - regras_especificas_do_trader
  - decisao_de_consolidacao_das_branches
merge: nao_autorizado
deploy: nao_autorizado
```