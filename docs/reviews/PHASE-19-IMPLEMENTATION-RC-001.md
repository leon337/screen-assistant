# RC-001 — Fase 19: UX orientada por intenção e Leonardo Trader V2

## Escopo

Revisão da implementação presente em `feat/phase-19-intent-trader-v2`.

## Materiais revisados

- jornada mobile premium da Fase 18 R2;
- seleção por intenção;
- perfis especializados;
- Leonardo Trader V2;
- contratos de tarefa e profundidade;
- validação do servidor;
- PWA;
- testes automatizados;
- limites de segurança financeira.

## Resultado

```yaml
veredito: PASS_WITH_MINOR_RESERVATIONS
critical: 0
high: 0
medium: 0
low: 2
tests: 64
pass: 64
fail: 0
secret_scan: PASS
```

## Confirmações

- usuário escolhe objetivo antes do especialista;
- especialista e tarefa permanecem coerentes;
- Leonardo Trader possui seis tarefas operacionais;
- análise completa preserva as 11 seções aprovadas;
- entrada educacional contém direção, contexto, região, gatilho, invalidação, proteção, objetivos, risco-retorno, qualidade e condições para não operar;
- todas as tarefas do Trader incluem risco ou condição para não operar;
- nenhuma ordem financeira é executada;
- nenhuma garantia ou promessa de lucro é permitida;
- resultado vazio é ocultado no mobile;
- estado operacional aparece em `Mais`;
- compartilhamento de tela sai da jornada mobile e permanece no desktop;
- CI e verificação de segredos foram aprovadas.

## Histórico da CI

### Primeira execução

Falhou por dois problemas de compatibilidade de testes:

1. módulo visual carregado em Node sem `document`;
2. teste antigo procurava a política de cautela no endpoint em vez do módulo de prompts.

As causas foram corrigidas sem reduzir a política de segurança.

### Execução aprovada

- Workflow: `30772009085`;
- Job: `91560656957`;
- Testes: 64;
- Aprovados: 64;
- Falhas: 0;
- Verificação básica de segredos: aprovada.

## Ressalvas baixas

### L-01 — validação visual real pendente

A interface ainda não foi validada em preview publicado porque deploy não foi autorizado.

### L-02 — avaliação semântica com gráficos reais pendente

Os contratos e limites foram testados, mas a qualidade das respostas do Gemini deve ser avaliada posteriormente com imagens reais em modo de estudo.

## Gates

```yaml
merge: nao_autorizado
deploy: nao_autorizado
producao: intacta
proximo_gate: decisao_do_leo
```
