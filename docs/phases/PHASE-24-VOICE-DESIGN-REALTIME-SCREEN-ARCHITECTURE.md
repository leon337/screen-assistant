# Fase 24 — Voz, design e visão de tela em tempo real

## Estado

```yaml
fase: 24
status: PROPOSTA_TECNICA
implementacao: NAO_INICIADA
merge: NAO_AUTORIZADO
producao: INTACTA
origem: validacao_real_no_Android_em_2026-08-03
```

## 1. Resultado confirmado da Fase 23

A validação no Android confirmou:

- voz restrita a português do Brasil;
- controle de velocidade funcional;
- comando falado alterando a velocidade para 0.9x;
- microfone ativo com estado visível;
- remoção das vozes indevidas do seletor.

## 2. Problemas de experiência observados

### 2.1 Voz

- o painel ocupa espaço vertical excessivo;
- o seletor de voz apresenta texto truncado;
- existem ações duplicadas entre `Ouvir`, `Interromper voz` e o painel de voz;
- a lista de comandos é longa para a tela principal;
- o estado do microfone e o estado da leitura não são claramente separados;
- não existe controle de volume, tom ou modo de resposta;
- não existe conversa por turnos com interrupção natural da fala;
- o usuário precisa memorizar a frase de ativação e os comandos completos.

### 2.2 Design mobile

- o resultado, as ações e os controles de voz formam uma página muito longa;
- o botão `Interromper voz` ocupa largura total mesmo quando não há leitura ativa;
- o cabeçalho tem dois controles de saída/voz competindo pela atenção;
- a ajuda de comandos deveria abrir em modal ou folha inferior;
- o painel `Mais opções` repete ações já presentes acima;
- o seletor precisa mostrar um nome curto de voz e detalhes secundários separados;
- controles flutuantes externos podem cobrir partes da interface;
- falta um modo compacto dedicado a uso por voz.

## 3. Objetivo da Fase 24

Transformar o Screen Assistant em uma experiência assistiva orientada por voz capaz de:

```text
iniciar uma sessão autorizada de compartilhamento
→ observar quadros relevantes da tela
→ detectar mudanças visuais
→ receber uma pergunta por voz
→ analisar o quadro atual e o contexto recente
→ responder por voz
→ continuar a sessão enquanto o usuário mantiver a autorização
```

O termo `tempo real` será usado com precisão:

- não significa transmitir cada quadro de vídeo ao modelo;
- significa capturar e analisar quadros por evento ou mudança visual;
- a resposta deve usar o quadro mais recente e um pequeno histórico contextual;
- o usuário precisa ver quando a tela está sendo capturada e quando uma análise está em andamento.

## 4. Arquitetura proposta

### 4.1 Fase 24A — voz e design na PWA

#### Entregas

1. Barra de voz compacta e fixa:
   - estado do microfone;
   - estado da leitura;
   - velocidade;
   - botão único iniciar/parar.

2. Folha inferior `Configurações de voz`:
   - voz pt-BR;
   - velocidade;
   - teste;
   - comandos disponíveis;
   - modo de resposta: curta, normal ou detalhada.

3. Conversação por turnos:
   - usuário fala;
   - interface mostra a transcrição;
   - pergunta é confirmada;
   - resposta é lida;
   - microfone retorna automaticamente.

4. Interrupção da resposta:
   - tocar em `Parar`;
   - dizer `Screen Assistente, parar`;
   - começar a falar durante a resposta, quando o navegador permitir.

5. Estados explícitos:

```yaml
VOICE_IDLE: microfone_desligado
VOICE_LISTENING: ouvindo_frase_de_ativacao
VOICE_COMMAND: recebendo_comando
VOICE_ANALYZING: aguardando_analise
VOICE_SPEAKING: lendo_resposta
VOICE_ERROR: erro_recuperavel
```

#### Critérios de aceite

- nenhuma ação de voz duplicada;
- painel principal com no máximo uma linha de controles;
- seletor sem texto cortado;
- ajuda fora do fluxo principal;
- velocidade ajustável por toque e voz;
- status compreensível sem depender de cor;
- foco e áreas de toque adequados para mobile.

### 4.2 Fase 24B — visão quase em tempo real na web

A base já existente usa `navigator.mediaDevices.getDisplayMedia()`, exibe um vídeo local e captura manualmente um frame em WebP.

#### Evolução

1. Criar `screen-session-v24.js`.
2. Manter o `MediaStream` somente durante uma sessão visível e autorizada.
3. Capturar quadros em baixa frequência:
   - padrão: um quadro a cada 2 segundos;
   - modo econômico: somente quando houver comando;
   - modo mudança: capturar após diferença visual relevante.
4. Calcular uma assinatura visual local do quadro.
5. Não enviar quadros praticamente iguais.
6. Manter apenas os últimos 3 quadros em memória.
7. Ao ouvir `o que está acontecendo?`:
   - capturar o quadro atual;
   - incluir a pergunta transcrita;
   - anexar resumo do quadro anterior, quando existir;
   - enviar uma única solicitação de análise.
8. Ler a resposta e retomar a escuta.

#### Fluxo

```text
getDisplayMedia
→ video local
→ frame sampler
→ detector de mudança local
→ compressor WebP
→ endpoint de análise
→ resposta estruturada
→ síntese pt-BR
```

#### Limites

- depende do suporte do navegador;
- a página precisa permanecer em primeiro plano em muitos dispositivos móveis;
- não deve existir captura silenciosa;
- a sessão termina quando a faixa de vídeo for encerrada;
- o usuário deve poder pausar captura sem encerrar a conversa.

### 4.3 Fase 24C — aplicativo nativo Android

Esta é a solução recomendada para observar outros aplicativos no mesmo telefone.

#### Componentes Android

```text
MainActivity
MediaProjectionConsentController
ScreenCaptureForegroundService
VirtualDisplay
ImageReader
FrameSampler
FrameDiffEngine
SecureUploadClient
VoiceSessionController
OverlayStatusController opcional
```

#### Fluxo Android

```text
usuário toca em Compartilhar tela
→ Android mostra a autorização oficial
→ aplicativo inicia foreground service
→ MediaProjection cria VirtualDisplay
→ ImageReader recebe os quadros
→ FrameSampler reduz resolução e frequência
→ FrameDiffEngine descarta repetições
→ comando de voz solicita análise
→ quadro atual + pergunta são enviados
→ resposta retorna e é reproduzida
```

#### Regras obrigatórias

- solicitar consentimento para cada sessão;
- exibir notificação persistente durante a captura;
- encerrar ao receber `MediaProjection.Callback.onStop()`;
- liberar `VirtualDisplay`, `ImageReader`, superfícies e áudio;
- nunca armazenar continuamente a tela por padrão;
- não capturar campos protegidos ou telas que retornem imagem preta;
- permitir pausa imediata;
- mostrar indicador visual de captura;
- excluir notificações da análise quando o Android permitir compartilhamento de um único app.

#### Compatibilidade planejada

- Android 13: compartilhamento da tela inteira com consentimento;
- Android 14 QPR2 ou superior: opção de compartilhar somente um aplicativo;
- a experiência web continua disponível como fallback.

## 5. Integração com modelos

### 5.1 MVP com backend atual

Manter o endpoint atual de análise por imagem e adicionar:

```http
POST /api/v1/analyze-live-frame
```

Campos:

```yaml
frame: image/webp
question: string
sessionId: uuid
frameId: uuid
previousSummary: string_opcional
profileId: string
taskId: string
responseMode: short|standard|detailed
```

O servidor responde com:

```yaml
answer: string
screenSummary: string
changesDetected: string[]
confidenceNotes: string[]
requestId: string
model: string
```

### 5.2 Evolução com sessão multimodal em tempo real

Uma API multimodal em tempo real pode receber áudio e imagens com baixa latência. Mesmo assim, o vídeo deve ser convertido em quadros selecionados; não será tratado como transmissão ilimitada de vídeo para o modelo.

A arquitetura deve permitir dois adaptadores:

```text
CurrentImageAnalysisAdapter
RealtimeMultimodalAdapter
```

## 6. Segurança e privacidade

### 6.1 Princípios

- consentimento explícito;
- captura visível;
- processamento mínimo;
- retenção mínima;
- usuário controla início, pausa e término;
- sem captura em segundo plano sem indicador;
- sem upload de quadros idênticos;
- não registrar conteúdo integral da tela em logs;
- remover metadados desnecessários;
- limitar resolução e tamanho;
- autenticação obrigatória;
- rate limit por usuário e sessão.

### 6.2 Indicadores obrigatórios

```yaml
captura_ativa: indicador_verde_e_texto
captura_pausada: indicador_amarelo_e_texto
analise_em_andamento: indicador_animado_e_texto
microfone_ativo: indicador_separado
resposta_em_reproducao: indicador_separado
```

## 7. Controle de custo e desempenho

### Política inicial

```yaml
resolucao_maxima: 1280_px_no_maior_lado
formato: webp
qualidade: 0.70
frequencia_maxima: 0.5_fps
historico_em_memoria: 3_quadros
upload_por_mudanca: true
upload_por_comando: true
upload_continuo: false
```

### Detector de mudança

O cliente deve:

1. reduzir o quadro para uma miniatura pequena;
2. converter para escala de cinza;
3. comparar com a miniatura anterior;
4. calcular percentual de pixels alterados;
5. descartar o quadro abaixo do limiar;
6. nunca usar a decisão local como análise semântica.

## 8. Comandos de voz propostos

```text
Screen Assistente, iniciar compartilhamento
Screen Assistente, pausar observação
Screen Assistente, continuar observação
Screen Assistente, o que está na tela?
Screen Assistente, o que mudou?
Screen Assistente, explique esta tela
Screen Assistente, leia a resposta
Screen Assistente, resposta curta
Screen Assistente, resposta detalhada
Screen Assistente, parar
Screen Assistente, encerrar compartilhamento
```

O comando `iniciar compartilhamento` apenas prepara a interface. A autorização oficial do sistema continua exigindo interação direta do usuário.

## 9. Ordem recomendada de implementação

```yaml
1: refatorar_design_de_voz
2: criar_maquina_de_estados_de_voz
3: integrar_transcricao_com_pergunta
4: criar_sessao_web_de_tela
5: adicionar_captura_por_comando
6: adicionar_detector_de_mudanca
7: criar_endpoint_live_frame
8: validar_desktop
9: criar_prototipo_Android_MediaProjection
10: validar_no_Realme_9i
11: revisar_privacidade_e_custos
12: RC_independente
```

## 10. Gate de decisão

Antes de código funcional da Fase 24C, decidir:

```yaml
produto_final:
  opcao_A: PWA_com_recursos_limitados
  opcao_B: PWA_mais_aplicativo_Android
recomendacao: opcao_B
```

A recomendação é manter a PWA como interface web e criar um cliente Android leve para captura contínua autorizada. O backend, autenticação, perfis, análise e histórico podem continuar compartilhados.

## 11. Aceite global da Fase 24

A fase será considerada concluída somente quando:

- voz e design passarem em mobile;
- a sessão de tela mostrar estado claro;
- nenhuma captura ocorrer sem consentimento;
- a pergunta falada analisar o quadro atual;
- a resposta for reproduzida em pt-BR;
- o usuário puder interromper tudo imediatamente;
- quadros repetidos não forem enviados;
- custos e frequência forem limitados;
- Android encerrar corretamente a projeção;
- testes automatizados e teste real no aparelho forem aprovados;
- RC independente emitir PASS;
- merge continuar dependente de autorização explícita.
