# Fase 24A — Incidente 006 — travamento ao ouvir análise no desktop

## Evidência real

O usuário enviou captura do Brave/Linux exibindo a caixa `Página sem resposta` após acionar a leitura da análise. Nenhum áudio foi reproduzido e o controle de microfone permaneceu em `Ouvindo…`.

## Observabilidade

No horário do incidente, o deployment registrou:

```yaml
streaming:
  route: /api/v1/synthesize-speech-stream
  response: 503
  provider_status: 400
  provider_message: Audio_mime_type_is_not_supported_in_response_format

fallback_completo:
  route: /api/v1/synthesize-speech
  response: 429
  provider_status: RESOURCE_EXHAUSTED
```

O clique tentou o streaming e depois a geração completa. Nenhum dos dois caminhos produziu áudio.

## Causas

### Contrato incompatível

A rota de streaming enviava:

```json
{
  "response_format": {
    "type": "audio",
    "mime_type": "audio/l16",
    "delivery": "inline"
  }
}
```

O contrato atual da Gemini Interactions API aceita somente:

```json
{
  "response_format": {
    "type": "audio"
  }
}
```

### Fallback sem cota

Depois do erro do streaming, o cliente executava a geração completa. A cota do modelo TTS estava esgotada e a rota retornou `429`.

### Risco de bloqueio da thread principal

O player progressivo copiava todo o PCM acumulado a cada novo bloco:

```text
collectedBytes = concatBytes(collectedBytes, novoBloco)
```

Esse padrão cresce de forma quadrática para respostas longas e pode bloquear o navegador.

### Concorrência com microfone

A leitura podia começar enquanto o fluxo de microfone ainda estava ativo. O estado visual permanecia em `Ouvindo…` durante a tentativa de síntese.

## Classificação CAF

```yaml
classe: RECUPERAVEL
backend_da_análise: operacional
produção_alterada: false
main_alterada: false
navegador_travado: true
áudio_reproduzido: false
```

## Correção

### Backend

Arquivo:

```text
api/v1/synthesize-speech-stream.js
```

- removidos `mime_type` e `delivery` de `response_format`;
- preservados autenticação, rate limit, SSE e `stream: true`.

### Player seguro do desktop

Arquivo:

```text
public/voice-desktop-playback-safety-v24a.js
```

Comportamento:

1. cancela o microfone antes da leitura;
2. desativa o pré-carregamento neural no desktop;
3. realiza uma única chamada progressiva por clique;
4. exige primeiro áudio em até sete segundos;
5. limita a requisição total a vinte segundos;
6. processa PCM em blocos de até um segundo;
7. devolve a thread ao navegador entre blocos;
8. não acumula todo o áudio para cache;
9. em `400`, `429`, `503`, timeout ou ausência de áudio, usa imediatamente a voz local;
10. divide a leitura local em trechos de até 650 caracteres;
11. aplica cooldown de dez minutos depois de `429`;
12. mantém o botão e a página recuperáveis.

## Segurança e privacidade

- chave Gemini permanece somente no servidor;
- áudio e respostas de API permanecem fora do cache da PWA;
- nenhum PCM é persistido;
- nenhuma gravação de microfone é mantida;
- o Android permanece no fluxo já validado.

## Critérios de reteste

1. abrir o novo preview;
2. fazer uma análise no computador;
3. manter o microfone desligado;
4. clicar em `Ouvir`;
5. confirmar que a página continua responsiva;
6. quando houver cota, confirmar a voz natural;
7. quando a cota estiver indisponível, confirmar início da voz local;
8. confirmar que o botão não fica em `Ouvindo…`;
9. clicar em `Parar` durante a leitura;
10. repetir com uma resposta longa.

## Estado

```yaml
implementation: COMPLETE_ON_BRANCH
device_retest: PENDING
vercel_build_rate_limit: PENDING_EXTERNAL_RELEASE
merge: NOT_AUTHORIZED
production_deployment: NOT_AUTHORIZED
```
