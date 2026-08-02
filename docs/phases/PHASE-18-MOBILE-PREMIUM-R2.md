# Fase 18 — Aplicativo mobile premium R2

## Estado

- Branch: `feat/phase-18-redesign-r2`
- Base: `main`
- Produção: não alterada
- Segurança do token: fora do escopo desta revisão

## Objetivo

Substituir o refinamento visual rejeitado do PR #6 por uma experiência mobile semelhante a aplicativo nativo, com navegação persistente, separação clara de tarefas e foco em uma tela por vez.

## Direção aprovada pelo Léo

Opção 2 — Aplicativo mobile premium.

## Arquitetura de navegação

A experiência móvel possui três telas:

1. **Analisar** — câmera, galeria, prévia, pergunta e envio.
2. **Resultado** — resposta da IA e ações de copiar, ouvir e compartilhar.
3. **Estado** — publicação, provedor Gemini e prontidão operacional.

A barra inferior muda a tela ativa e usa `aria-current` para indicar a seção selecionada.

## Implementação

- `public/premium-v18.css`: camada visual mobile premium;
- `public/premium-v18.js`: navegação e troca de telas;
- `public/index.html`: estrutura das três telas e navegação inferior;
- `public/design.js`: carregamento do controlador premium;
- `public/service-worker.js`: cache `screen-assistant-v18-r2`;
- `src/server/config.js`: release `phase-18-mobile-premium-r2`;
- `tests/phase18-premium-mobile.test.js`: regressão estrutural da experiência.

## Compatibilidade preservada

A implementação mantém os IDs consumidos por `public/app.js`. Permanecem disponíveis:

- câmera traseira;
- galeria;
- captura de tela no desktop;
- compressão de imagem;
- pergunta opcional;
- análise Gemini;
- progresso e cancelamento;
- resultado estruturado;
- cópia, voz e compartilhamento;
- painel operacional;
- PWA.

## Acessibilidade

- navegação com rótulos textuais;
- indicação `aria-current`;
- telas inativas com `aria-hidden`;
- alvos móveis amplos;
- suporte a `safe-area-inset-bottom`;
- ocultação das barras quando o teclado virtual está aberto;
- mensagens e funções preservadas sem depender somente de cor.

## Fora do escopo

- alteração do `PREVIEW_ACCESS_TOKEN`;
- correção de caracteres Unicode no cabeçalho de autenticação;
- mudança no contrato da API;
- mudança dos modelos Gemini;
- merge ou publicação em produção sem autorização do Léo.

## Critérios de aceite

- três telas móveis funcionais;
- navegação inferior persistente;
- análise abre a tela de resultado;
- nova análise retorna para a tela principal;
- painel operacional aparece na tela Estado;
- desktop preserva captura de tela;
- CI integral passa;
- preview Vercel fica READY;
- aprovação explícita do Léo antes do merge.
