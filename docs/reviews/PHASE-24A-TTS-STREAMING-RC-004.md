# Fase 24A — Streaming progressivo da voz natural — RC-004

## Escopo revisado

- proxy SSE autenticado;
- Gemini Interactions API com `stream: true`;
- eventos incrementais de áudio;
- PCM L16 a 24 kHz;
- buffer inicial de aproximadamente 240 ms;
- reprodução encadeada com Web Audio;
- cancelamento da transmissão;
- cache somente em memória;
- fallback para geração completa e voz local;
- publicação no runtime e na PWA.

## Evidências

```yaml
functional_head: 263e4c92efc57509bcc59b4f8c65c45ffa054c42
workflow: 30870521367
job: 91871405477
tests: 154
pass: 154
fail: 0
secrets: PASS
deployment: dpl_BwnqB9PHDNDJCGANFZwDdTQVSUDv
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

1. O Android precisa confirmar que a resposta SSE chega progressivamente e não é acumulada por alguma camada intermediária.
2. O tempo até o primeiro som precisa ser medido no mesmo aparelho e nas mesmas redes do teste anterior.
3. A continuidade entre blocos precisa ser confirmada em rede móvel instável.

### Baixo

1. Uma alteração de velocidade enquanto vários blocos já estão agendados pode produzir uma transição curta entre o bloco atual e o seguinte.

## Correções confirmadas por código e testes

- a geração completa não é mais o único caminho;
- o primeiro PCM pode ser reproduzido antes do fim da síntese;
- a rota exige autenticação;
- a chave não é exposta;
- o proxy usa `no-store` e desativa buffering explícito;
- o cliente usa `ReadableStream` e Web Audio;
- o usuário pode interromper a transmissão e a reprodução;
- o PCM concluído é reutilizado na mesma aba;
- uma nova resposta invalida o cache anterior;
- a API e o áudio permanecem fora do cache da PWA;
- falhas retornam ao fluxo anterior.

## Veredito

```yaml
verdict: PASS_WITH_DEVICE_STREAMING_GATE
merge: NOT_AUTHORIZED
production: NOT_CHANGED_BY_THIS_PHASE
```

## Roteiro de validação

1. Abrir o preview novo.
2. Fazer uma análise.
3. Tocar em `Ouvir` imediatamente quando a resposta aparecer.
4. Medir aproximadamente o tempo até o primeiro som.
5. Confirmar que a interface já mostra leitura enquanto o restante continua chegando.
6. Ouvir até o fim e verificar cortes ou silêncios.
7. Parar durante o início da transmissão.
8. Repetir a mesma resposta e confirmar início imediato.
9. Alterar entre 0.8x, 1.0x, 1.2x e 1.4x.
10. Repetir o teste em Wi-Fi e rede móvel.
