# RC-001 — Leonardo Trader V2

## Escopo

Revisão independente dos artefatos:

- `TRADER-AGENT-V2-MASTER-PROMPT.md`;
- `TRADER-AGENT-V2-RESPONSE-CONTRACTS.md`;
- `PHASE-19-DEC-001-ADOTAR-LEONARDO-TRADER-V2.md`.

## Fonte

Prompt Mestre enviado por Léo em 2 de agosto de 2026.

## Critérios

- fidelidade à missão definida por Léo;
- veracidade da identidade;
- caráter educacional;
- cenários condicionais;
- gestão de risco;
- ausência de ordem direta;
- suporte mobile;
- separação entre política, tarefa e formato;
- coerência dos contratos;
- condições de implementação.

## Resultados

### Identidade

`PASS`

O perfil não afirma experiência profissional real, certificações ou rentabilidade comprovada.

### Missão educacional

`PASS`

A análise ensina estrutura, cenários, confirmações, invalidações e risco.

### Fidelidade ao Prompt Mestre

`PASS`

Os elementos centrais enviados por Léo foram preservados. As adaptações estão explicitamente documentadas.

### Experiência mobile

`PASS_WITH_RESERVATION`

A divisão entre modos rápido, padrão e completo reduz excesso de conteúdo. A implementação visual ainda não existe.

### Segurança e risco

`PASS`

Execução de ordens, garantias, alavancagem excessiva e recuperação impulsiva de perdas estão proibidas.

### Cenários e entrada educacional

`PASS`

Cenários exigem condições, gatilhos e invalidação. Entrada é hipótese educacional, nunca ordem direta.

### Contratos de resposta

`PASS_WITH_RESERVATION`

Os contratos são coerentes, mas a API atual ainda entrega Markdown livre. A validação estruturada deve ser criada antes de produção.

### Nome

`PASS_WITH_RESERVATION`

Existe um agente metodológico chamado Leonardo. A decisão resolve a colisão usando sempre `Leonardo Trader` para o perfil público.

## Achados

```yaml
critical: 0
high: 0
medium: 2
low: 1
```

### M-01 — saída estruturada ainda não implementada

A API atual não valida os contratos JSON da V2.

**Tratamento:** obrigatório antes de produção.

### M-02 — base de branches não consolidada

Perfis especialistas e propostas da Fase 18 ainda estão em branches separadas.

**Tratamento:** definir base antes de alterar código.

### L-01 — ambiguidade nominal

`Leonardo` e `Leonardo Trader` exigem qualificação consistente.

**Tratamento:** documentado e não bloqueante.

## Veredito

```yaml
veredito: PASS_WITH_IMPLEMENTATION_GATES
requisitos_do_leo: assimilados
planejamento: aprovado
implementacao: bloqueada
merge: nao_autorizado
deploy: nao_autorizado
```

## Gates para implementação

1. escolher a base visual da Fase 18;
2. consolidar o seletor de especialistas;
3. aprovar wireframe da jornada orientada por intenção;
4. implementar contrato estruturado com fallback seguro;
5. adicionar testes de cenários, dados ausentes e proibições;
6. executar nova RC antes de merge.
