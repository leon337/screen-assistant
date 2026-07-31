# Fase 14 — Experiência mobile-first e PWA

## Objetivo

Transformar a interface responsiva da Fase 13 em uma experiência mobile-first, mantendo câmera, galeria, compartilhamento de tela no desktop, Gemini, fallback, Markdown seguro, cópia e voz.

## Entregas

- detecção por tela pequena ou ponteiro de toque;
- alternância manual entre modo compacto e desktop, persistida localmente;
- painel de compartilhamento recolhível no mobile;
- barra inferior com Foto, Galeria e Analisar;
- ações Nova análise, Trocar imagem, Repetir, Compartilhar e Limpar;
- etapas de progresso e cancelamento da requisição;
- respostas em Resumo, Observação direta, Interpretação e Detalhes técnicos;
- detalhes recolhidos no modo compacto;
- manifest, service worker e ícones PWA;
- cache restrito ao shell estático, sem API, imagens ou respostas;
- refatoração parcial em módulos de análise, resposta e PWA.

## Segurança e privacidade

- a chave Gemini permanece no backend;
- imagens não são persistidas;
- requisições de análise não são armazenadas pelo service worker;
- o cache PWA contém somente arquivos estáticos;
- Markdown continua escapando HTML e bloqueando links inseguros.

## Validação

- 32/32 testes automatizados aprovados;
- sintaxe aprovada para frontend, service worker e backend;
- smoke test HTTP do shell, manifest, service worker, módulos e ícones aprovado;
- validação real em produção e instalação Android permanecem como provas externas finais.
