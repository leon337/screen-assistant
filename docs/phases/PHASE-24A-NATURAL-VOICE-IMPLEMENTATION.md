# Fase 24A — Implementação da voz natural pt-BR

## Objetivo

Melhorar a naturalidade da leitura sem remover a voz local já validada no Android e corrigir os problemas de sobreposição observados na RC-002.

## Arquitetura implementada

```text
Resposta pronta
→ usuário toca em Ouvir
→ cliente solicita áudio autenticado
→ backend usa Gemini TTS
→ PCM 24 kHz retorna ao aparelho
→ cliente encapsula PCM em WAV
→ player reproduz na velocidade selecionada
→ reconhecimento de comandos é retomado após a leitura
```

## Backend

- `POST /api/v1/synthesize-speech`;
- autenticação Supabase obrigatória;
- rate limit separado por usuário e IP;
- texto limitado por configuração;
- `GEMINI_API_KEY` somente no servidor;
- modelo padrão `gemini-3.1-flash-tts-preview`;
- voz padrão `Sulafat`;
- timeout próprio;
- erros controlados para cota, chave, modelo, rede e timeout.

## Preparação do texto

Antes da síntese:

- blocos de código são removidos;
- títulos e listas deixam de ser pronunciados como Markdown;
- links são convertidos para o texto visível;
- números, horários, valores e unidades são preservados;
- o texto é limitado a 4.000 caracteres por leitura.

## Player

- converte PCM base64 em WAV no próprio navegador;
- aplica `playbackRate` sem solicitar nova geração;
- cancela requisições TTS pendentes;
- libera URLs temporárias após uso;
- pausa comandos durante a reprodução;
- retoma comandos após a leitura;
- usa a voz local automaticamente quando a geração neural falha.

## Design mobile

- barra em fluxo normal, sem `position: fixed`;
- exibição somente na tela de resultado com resposta pronta;
- ocultação durante análise;
- quatro controles em uma linha: Mic, Ouvir/Parar, velocidade e Ajustes;
- folha inferior limitada a 75% da altura;
- seletor local oculto quando existe apenas uma voz;
- remoção da repetição do nome do idioma;
- ausência de sondagem contínua por intervalo.

## Cache e privacidade

- assets estáticos publicados pela PWA;
- rotas `/api/` não são armazenadas pelo service worker;
- áudio gerado não é persistido pelo aplicativo;
- preferência salva: apenas modo Natural ou Dispositivo;
- nenhuma transcrição de microfone é persistida.

## Arquivos principais

- `api/v1/synthesize-speech.js`;
- `src/server/providers/gemini-tts.js`;
- `src/server/config.js`;
- `public/natural-voice-v24a.js`;
- `public/voice-v24a.js`;
- `public/voice-v24a.css`;
- `public/design.js`;
- `public/service-worker.js`;
- `tests/phase24a-natural-voice.test.js`;
- `tests/phase24a-voice-design.test.js`.

## Evidências

```yaml
functional_head: 90cee7ba7a8ac20765f2107026ae45027bc931ee
workflow: 30856839993
job: 91829721472
tests: 142
pass: 142
fail: 0
secrets: PASS
deployment: dpl_CGNnebrjujUrJAaRAk9wYXiUXqwk
deployment_state: READY
runtime_error_or_fatal_observed: 0
```

## Estado

```yaml
phase: 24A
implementation: COMPLETE_IN_BRANCH
device_validation: PENDING
merge: NOT_AUTHORIZED
production: NOT_CHANGED_BY_THIS_PHASE
```
