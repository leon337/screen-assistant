# Screen Assistant — Markdown e precisão visual

Release: `phase-12-markdown-precision`

## Correções

- Renderização de títulos Markdown de `#` até `######`.
- Renderização de separadores `---`, `***` e `___` como linha horizontal.
- Estilos visuais para títulos H4, H5, H6 e separadores.
- Cópia e síntese de voz removem títulos e separadores Markdown.
- Prompt do Gemini proíbe completar lacunas ou estimar texto pequeno, borrado ou oculto.
- Para conteúdo incerto, o modelo deve escrever `não foi possível confirmar` e indicar a região da imagem.
- Gráficos financeiros são descritos sem garantia de tendência ou recomendação de compra, venda ou aposta.

## Validação

- 11 verificações automatizadas: PASS.
- Deploy Vercel: READY.
- Endpoint `/ready`: HTTP 200.
- Release publicada: `phase-12-markdown-precision`.
- Gemini configurado no backend: sim.
