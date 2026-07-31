# Fase 15 — Redesign e sistema visual

## Objetivo

Transformar o Screen Assistant de um protótipo técnico funcional em uma interface mais clara, consistente e próxima de um produto da Predix AI, sem alterar o backend nem os contratos já validados.

## Problemas observados

- câmera, galeria, compartilhamento e ações secundárias disputavam atenção;
- a ação principal não estava suficientemente destacada;
- a resposta extensa ocupava uma área contínua e pouco hierarquizada;
- ações destrutivas apareciam junto de ações frequentes;
- a aplicação não possuía identidade visual própria;
- estados vazios tinham pouca orientação para o usuário.

## Direção aprovada

```text
Selecionar imagem
→ fazer pergunta opcional
→ analisar
→ ler, copiar, ouvir ou compartilhar
```

## Entregas

- identidade visual Predix AI Lab;
- novo cabeçalho e marca visual construída em CSS;
- design tokens de cor, superfície, borda, raio e sombra;
- câmera e galeria como cartões de entrada;
- compartilhamento de tela como ferramenta secundária;
- pré-visualização com estado vazio orientativo;
- CTA principal “Analisar imagem”;
- resposta em cartão de leitura;
- ações rápidas separadas de opções avançadas;
- banner de privacidade mais visível;
- seção explicativa de funcionamento;
- barra móvel redesenhada;
- tema PWA atualizado;
- foco de teclado e `prefers-reduced-motion` preservados.

## Arquivos modificados

```text
public/index.html
public/styles.css
public/design.js
public/manifest.webmanifest
public/service-worker.js
tests/phase15-design.test.js
CHANGELOG.md
package.json
```

## Salvaguardas

Não foram alterados:

- contrato da API;
- chave e variáveis do Gemini;
- fallback entre modelos;
- compressão de imagem;
- câmera e galeria;
- compartilhamento de tela;
- Markdown seguro;
- síntese de voz;
- política de cache da API;
- persistência de dados.

## Critérios de aceite

- todos os IDs funcionais anteriores permanecem no HTML;
- testes das fases anteriores continuam aprovados;
- testes específicos da Fase 15 aprovados;
- API e backend sem mudanças;
- layout utilizável em desktop e smartphone;
- nenhuma chave ou segredo no diff;
- PWA atualiza o shell estático para a versão 15;
- promoção somente após CI aprovado.

## Integração GitHub–Vercel

O objetivo operacional é usar `leon337/screen-assistant` como origem do projeto Vercel, com:

```text
main → produção
pull request/branch → preview
```

A conexão deve preservar as variáveis protegidas já existentes no projeto `screen-assistant-preview-20260731`. A integração só é considerada concluída quando um commit do GitHub aparece como origem de um deployment da Vercel.
