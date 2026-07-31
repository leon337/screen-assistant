# Histórico completo de construção

## Visão geral

Este documento registra a evolução do Screen Assistant desde a pesquisa inicial até a versão mobile-first e PWA publicada em 31 de julho de 2026.

## Fases 1 a 3 — descoberta, fluxo e arquitetura

### Fase 1 — problema e pesquisa cloud

Foi definido o objetivo de construir uma solução 100% em nuvem, com captura autorizada no navegador, backend leve, análise multimodal e resposta em texto ou voz.

Foram avaliados:

- Vercel;
- Cloudflare Workers;
- Supabase;
- Gemini;
- GLM;
- limitações de cotas, hibernação, timeout e segurança de chaves.

### Fase 2 — equipe de agentes

Foi criado o fluxo Mestre → Leonardo → Léo → Mestre → proprietário, separando coordenação, revisão arquitetural e execução.

### Fase 3 — arquitetura inicial

A arquitetura conceitual separou:

- frontend de captura;
- processamento local da imagem;
- backend serverless;
- provedor multimodal;
- resposta em texto e voz;
- segurança, autenticação e rate limiting como camadas futuras.

## Fase 4 — fundação técnica

Foi criada uma fundação com frontend, Worker, tipos compartilhados, testes, CI e documentação. O ambiente não disponibilizou pacotes npm externos, então o frontend usou DOM nativo como contingência.

## Fase 5 — captura autorizada

Foi implementado `getDisplayMedia()`, pré-visualização, encerramento do stream, captura manual de um frame, redimensionamento e compressão local.

## Fase 6 — backend simulado

Foi criado o primeiro contrato `POST /api/v1/analyze-screen`, ainda sem IA real. O objetivo era provar o fluxo navegador → backend → resposta.

## Fase 7 — Gemini

O backend passou a integrar o Gemini, mantendo a chave somente no servidor e normalizando erros do provedor.

## Fase 8 — resposta e voz

Foram adicionados:

- exibição de resposta;
- copiar texto;
- síntese de voz local;
- interrupção da leitura;
- estados de carregamento e erro.

## Fase 9 — autenticação e proteção

A fundação histórica incorporou Supabase Auth, validação de JWT, CORS restrito e rate limiting. Essa arquitetura foi validada como estudo e implementação intermediária, mas não está presente no runtime simplificado atual da Vercel.

## Fase 10 — GLM e fallback entre provedores

Foi implementado um roteador Gemini → GLM na fundação histórica. O fallback ocorria somente em timeout, indisponibilidade ou limite do provedor. A versão atual usa fallback entre dois modelos Gemini e não inclui GLM.

## Fase 11 — deploy, observabilidade e feature flags

Foram estudados e implementados na fundação:

- Cloudflare Pages e Workers;
- logs estruturados;
- circuit breaker;
- feature flags;
- runbook de rollback;
- endpoint `/ready`.

## Fase 12 — Git local, preview e validação externa

O projeto foi versionado localmente e publicado em um projeto Vercel isolado. O repositório remoto ainda não existia naquela etapa. O preview foi validado por HTTPS, `/health` e `/ready`.

### Ativação do Gemini real

O proprietário adicionou manualmente as variáveis na Vercel:

- `GEMINI_API_KEY`;
- `AI_MODE`;
- `GEMINI_MODEL`;
- `GEMINI_TIMEOUT_MS`;
- posteriormente `GEMINI_FALLBACK_MODEL`.

### Falhas reais encontradas

- modelo principal retornando alta demanda;
- modelo alternativo indisponível para a chave;
- timeout da função Vercel;
- frontend tentando interpretar erro textual como JSON;
- deploy intermediário com empacotamento incorreto;
- Markdown exibido como texto literal.

### Correções

- fallback entre modelos Gemini;
- tratamento seguro de respostas não JSON;
- timeout menor por tentativa;
- Markdown seguro;
- títulos de H1 a H6;
- separadores horizontais;
- política cautelosa para textos pequenos;
- validação real ponta a ponta.

## Fase 13 — câmera e galeria

A aplicação passou a aceitar:

- foto da câmera traseira;
- imagem da galeria;
- pré-visualização;
- compressão local;
- correção de orientação;
- envio do mesmo formato usado pela captura desktop.

Os testes reais no Android confirmaram câmera, galeria, compressão e análise.

## Fase 14 — mobile-first e PWA

A interface recebeu:

- modo compacto automático;
- alternância manual para desktop;
- painel de compartilhamento recolhível;
- barra inferior de ações;
- ações após análise;
- respostas em seções;
- progresso detalhado;
- cancelamento;
- manifesto e service worker;
- instalação como PWA;
- refatoração parcial em módulos.

## Criação do repositório remoto

Em 31 de julho de 2026, o proprietário criou:

```text
https://github.com/leon337/screen-assistant
```

A partir desse ponto, o GitHub passa a ser a memória central do projeto.

## Situação atual

O código deste repositório representa a Fase 14 em produção. Documentos das fases anteriores registram decisões e experimentos históricos; eles não devem ser interpretados automaticamente como funcionalidades ativas no runtime atual.
