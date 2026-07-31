# Screen Assistant — Ajustes de Interface

Release: `phase-12-markdown-ui`

## Alterações

- Renderização segura de Markdown.
- Suporte a títulos, listas, negrito, itálico, links, citações e blocos de código.
- Escape de HTML e bloqueio de links com protocolos inseguros.
- Cópia em texto puro, sem símbolos Markdown.
- Leitura em voz usando texto limpo.
- Indicador visual durante a análise.
- Rolagem automática para a resposta.
- Metadados do modelo e uso de fallback preservados.
- Prompt do Gemini orientado a respostas estruturadas e sem HTML bruto.

## Testes

- 5/5 testes do renderizador aprovados.
- Release `/ready` validado em produção.
- Arquivo `/markdown.js` validado com HTTP 200.
