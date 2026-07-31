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

## Validação

```yaml
pull_request: 2
ci: 38/38_PASS
merge_commit: 9c512b866d7735d63c8b2c5d41e882387bcf0e69
segredos_detectados: NÃO
backend_alterado_no_PR: NÃO
```

## Publicação na Vercel

O redesign foi publicado no projeto existente:

```yaml
project: screen-assistant-preview-20260731
deployment: dpl_4FPQnPt7pivBr5cWhBnrwynQKUxf
target: production
status: READY
release: phase-15-redesign
frontend_source: github-main
```

Como o conector disponível não expôs a operação de autorizar o repositório no projeto Vercel, foi implantada uma ponte controlada de origem:

```text
Vercel
→ função Edge de arquivos estáticos
→ arquivos públicos da branch main no GitHub
```

A API Gemini continua dentro do projeto Vercel e utiliza as variáveis protegidas existentes. A chave não é enviada ao GitHub nem ao navegador.

### Limitação da ponte

A ponte mantém a interface alinhada à `main`, mas não substitui a integração Git nativa da Vercel. Ela adiciona dependência de leitura do GitHub para servir os arquivos da interface.

## Integração GitHub–Vercel nativa

O estado desejado permanece:

```text
main → deployment de produção
pull request/branch → preview deployment
```

A integração nativa será considerada concluída somente quando a Vercel registrar o repositório e o SHA do commit como origem do deployment. Ainda é necessária a autorização do repositório `leon337/screen-assistant` nas configurações Git do projeto Vercel.

A autorização deve preservar:

- projeto existente `screen-assistant-preview-20260731`;
- branch de produção `main`;
- diretório raiz do repositório;
- variáveis de ambiente já cadastradas;
- domínio atual de produção.
