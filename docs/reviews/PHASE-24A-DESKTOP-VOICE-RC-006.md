# Fase 24A — Voz no computador — RC-006

## Escopo revisado

- leitura neural no desktop;
- remoção dos botões legados da experiência principal;
- push-to-talk com `MediaRecorder`;
- endpoint autenticado de transcrição;
- comandos de uma palavra;
- chamada longa opcional;
- cache PWA atualizado;
- preservação do fluxo Android já aprovado.

## Evidências funcionais

```yaml
functional_head: 78ad2df8b67b9f2ca28a205d8aebb90ad8619a10
workflow: 30872207378
job: 91876338841
tests: 163
pass: 163
fail: 0
secrets: PASS
deployment: dpl_DtLuDpfJDTrWNEPp7p4gPVW4BnRj
deployment_state: READY
runtime_error_or_fatal_observed: 0
```

## Achados

```yaml
critical: 0
high: 0
medium: 3
low: 1
```

### Médios

1. A permissão real do microfone precisa ser validada no navegador desktop do usuário.
2. A transcrição precisa ser testada com o microfone e ruído do ambiente real.
3. A leitura neural precisa ser confirmada no mesmo navegador Linux em que o módulo anterior falhou.

### Baixo

1. O push-to-talk exige um clique antes de cada comando no computador quando o reconhecimento contínuo não está disponível.

## Critérios de PASS no computador

1. fazer uma análise;
2. tocar em `Ouvir` e confirmar leitura neural;
3. tocar em `Parar`;
4. clicar em `Mic`;
5. liberar a permissão do navegador;
6. dizer `ler` e confirmar leitura;
7. dizer `parar`;
8. dizer `rápido`, `devagar` e `normal`;
9. dizer `novo`, `repetir` e `analisar` nos contextos válidos;
10. confirmar que não é necessário dizer `Screen Assistente`;
11. confirmar que os botões antigos não aparecem duplicados;
12. confirmar ausência de erros visíveis.

## Veredito

```yaml
verdict: PASS_WITH_DESKTOP_DEVICE_GATE
Android: PASS
Desktop: PENDING
merge: NOT_AUTHORIZED
```
