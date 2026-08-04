# Fase 24A — Streaming progressivo da voz natural

## Problema

A geração completa do áudio precisava terminar antes do primeiro som. O pré-carregamento reduzia a espera percebida, mas não alterava o caminho quando o usuário tocava em `Ouvir` antes do áudio estar pronto.

## Solução

```text
texto da resposta
→ endpoint autenticado
→ Gemini Interactions API com stream=true
→ eventos SSE step.delta/audio
→ PCM L16
→ buffer inicial de aproximadamente 240 ms
→ Web Audio API
→ reprodução enquanto a síntese continua
```

## Arquitetura

### Backend

Arquivo: `api/v1/synthesize-speech-stream.js`

- Edge Runtime;
- autenticação Supabase;
- limite separado por usuário e IP;
- chave Gemini apenas no servidor;
- proxy do corpo SSE sem armazenamento;
- `cache-control: no-store, no-transform`;
- `x-accel-buffering: no`;
- cancelamento propagado pelo sinal da requisição.

### Frontend

Arquivo: `public/natural-voice-stream-v24a.js`

- abre `AudioContext` durante a ação do usuário;
- lê o corpo SSE com `ReadableStream`;
- identifica eventos `step.delta` com `delta.type = audio`;
- converte PCM de 16 bits para `AudioBuffer`;
- inicia após buffer inicial curto;
- agenda blocos mantendo a ordem;
- permite parada e cancelamento;
- mantém o fallback de geração completa;
- reutiliza o PCM concluído somente em memória;
- não grava áudio em Local Storage, IndexedDB ou Cache Storage.

## Compatibilidade e fallback

```yaml
preferido: streaming_progressivo
fallback_1: áudio_completo_pré_carregado
fallback_2: geração_completa_da_voz_natural
fallback_3: voz_local_do_aparelho
```

## Segurança

- a chave do provedor não entra no navegador;
- a rota exige token válido;
- a API e o áudio não entram no service worker;
- o cache de repetição existe somente na memória da aba;
- uma nova resposta invalida o PCM anterior;
- fechar a aba cancela a transmissão e a reprodução.

## Evidências funcionais

```yaml
head: 263e4c92efc57509bcc59b4f8c65c45ffa054c42
workflow: 30870521367
job: 91871405477
tests: 154
pass: 154
fail: 0
secrets: PASS
deployment: dpl_BwnqB9PHDNDJCGANFZwDdTQVSUDv
deployment_state: READY
```

## Fontes primárias

- Gemini TTS: streaming disponível em modelos TTS 3.1, incluindo `gemini-3.1-flash-tts-preview`.
- Gemini Interactions API: eventos SSE `step.delta` podem transportar áudio.
- Gemini recomenda dividir saídas longas quando a qualidade puder variar ao longo de vários minutos.

## Critérios de validação no Android

1. fazer uma análise;
2. tocar em `Ouvir` imediatamente após a resposta;
3. medir o tempo até o primeiro som;
4. confirmar que a leitura começa antes de a síntese terminar;
5. verificar ausência de cortes ou intervalos;
6. alterar a velocidade;
7. interromper durante a geração;
8. repetir a mesma resposta e confirmar início imediato;
9. gerar uma resposta nova e confirmar invalidação do cache anterior;
10. testar em rede Wi-Fi e rede móvel.

## Estado

```yaml
implementation: COMPLETE_ON_BRANCH
merge: NOT_AUTHORIZED
device_gate: PENDING
```
