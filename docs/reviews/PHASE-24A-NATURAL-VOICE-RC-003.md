# Fase 24A — Voz natural e design mobile — RC-003

## Escopo revisado

- rota TTS autenticada;
- provedor Gemini TTS;
- conversão PCM para WAV;
- controle de velocidade;
- cancelamento da geração;
- fallback para voz local;
- barra mobile compacta;
- folha de ajustes;
- cache PWA;
- regressões das Fases 22A e 23.

## Evidências

```yaml
functional_head: 90cee7ba7a8ac20765f2107026ae45027bc931ee
final_head_before_preview_note: 8bfaef585e9f7968a8d43828fbde966add35a75a
workflow: 30856839993
final_workflow: 30857050385
job: 91829721472
final_job: 91830388159
tests: 142
pass: 142
fail: 0
secrets: PASS
functional_deployment: dpl_CGNnebrjujUrJAaRAk9wYXiUXqwk
final_deployment: dpl_GmhSdsWWbLP835unDtRprQZq6yAq
state: READY
runtime_error_or_fatal_observed: 0
```

## Preview final

```text
https://screen-assistant-preview-20260731-f3iqtcivs-predix-ai-br.vercel.app/?_vercel_share=BX2Z0fx2cEyPJw1fvEhlct53du0V7fjZ
```

O acesso temporário expira em 4 de agosto de 2026.

## Achados

```yaml
critical: 0
high: 0
medium: 3
low: 1
```

### Médios

1. A qualidade final da voz neural precisa ser avaliada no mesmo Android usado na RC-002.
2. O tempo real de geração depende da rede e da disponibilidade do modelo TTS.
3. A retomada automática do reconhecimento após áudio neural precisa de confirmação no navegador móvel.

### Baixo

1. O preview protegido pela Vercel apresenta um controle lateral da própria plataforma; esse elemento não pertence ao layout do aplicativo.

## Correções confirmadas por código e testes

- barra não usa posição fixa;
- barra aparece apenas com resultado pronto;
- barra fica ausente durante análise;
- folha limitada a 75dvh;
- uma única voz local não mantém seletor redundante;
- voz natural é padrão;
- voz do aparelho permanece disponível;
- API exige autenticação;
- chave do provedor não está no frontend;
- requisição pendente pode ser cancelada;
- API e áudio não entram no cache PWA.

## Veredito

```yaml
verdict: PASS_WITH_DEVICE_VALIDATION_GATE
merge: NOT_AUTHORIZED
production: NOT_CHANGED_BY_THIS_PHASE
```

## Roteiro de validação no Android

1. Abrir o preview novo e fazer uma análise geral.
2. Confirmar que a barra aparece somente após a resposta.
3. Confirmar que a barra não cobre conteúdo ou navegação.
4. Abrir Ajustes e verificar o modo Natural como padrão.
5. Tocar em Ouvir e avaliar naturalidade, ritmo e pronúncia.
6. Alterar para 0.8x, 1.0x, 1.2x e 1.4x sem gerar novo áudio.
7. Tocar em Parar durante “Gerando…” e confirmar que nada começa depois.
8. Tocar em Parar durante a leitura.
9. Ativar o microfone, ouvir a resposta e confirmar a retomada da escuta.
10. Selecionar Dispositivo e confirmar o fallback local.
11. Desconectar a rede e confirmar que a voz local continua disponível.
12. Fechar a folha por Fechar, toque externo e botão Voltar do Android.
