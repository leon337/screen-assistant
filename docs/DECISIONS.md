# Decisões arquiteturais

## 1. Captura somente com consentimento

A aplicação usa APIs acionadas por clique. Não existe captura automática ou em segundo plano.

## 2. Processamento local antes do envio

A imagem é redimensionada e comprimida no navegador para reduzir latência, custo e exposição de dados.

## 3. Segredos somente no backend

A chave Gemini nunca é enviada ao frontend nem incluída em URL.

## 4. Backend Edge na Vercel

A Vercel foi escolhida para o runtime atual por já hospedar o frontend e permitir funções leves no mesmo projeto.

## 5. Fallback limitado

A aplicação tenta no máximo dois modelos. Erros de entrada ou autenticação não geram nova chamada ao provedor alternativo.

## 6. Sem persistência de imagem

Banco de dados e histórico ficaram fora do MVP. A decisão reduz complexidade e risco de privacidade.

## 7. Markdown próprio e seguro

Foi criado um renderizador limitado, com escape de HTML e bloqueio de protocolos inseguros, evitando incluir uma dependência externa.

## 8. Mobile web antes de app nativo

Câmera e galeria foram implementadas como web app e PWA. Captura contínua da tela do Android/iOS ficou fora do escopo porque exige APIs nativas.

## 9. Arquitetura histórica preservada como documentação

Supabase, Cloudflare e GLM foram implementados ou estudados em fases anteriores, mas não fazem parte do runtime atual. Os relatórios permanecem como evidência e base para evolução futura.
