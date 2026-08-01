# Fase 16 — Segurança, Consistência e Preparação Pública

## Objetivo

Preparar o Screen Assistant para um piloto fechado, eliminando o acesso arbitrário à API, adicionando limitação básica por IP, validando entradas no backend, modularizando a integração Gemini e tornando a configuração operacional coerente.

## Modelo aprovado

- piloto fechado;
- credencial compartilhada validada no servidor;
- rate limiting básico por IP e memória;
- sem banco de dados;
- sem histórico de análises;
- sem persistência intencional de imagens;
- sem deploy em produção antes da aprovação final do Léo.

## Implementação

### Segurança

- `PREVIEW_ACCESS_TOKEN` é obrigatório e deve possuir pelo menos 16 caracteres;
- o backend compara a credencial recebida com a variável protegida;
- token ausente ou incorreto retorna `401`;
- o frontend não contém credencial fixa: o usuário autorizado informa o código durante a sessão;
- credencial, pergunta, imagem e resposta não devem ser registradas em logs.

### Rate limiting

- controle básico por IP;
- limite e janela configuráveis;
- excesso retorna `429` e `Retry-After`;
- implementação em memória é uma limitação conhecida em runtime Edge distribuído e não representa proteção global definitiva.

### Validação

- imagem obrigatória;
- apenas JPEG e WebP;
- limite configurável, com padrão de 2 MB;
- pergunta limitada no backend, com padrão de 1.000 caracteres;
- método diferente de `POST` é rejeitado.

### Arquitetura

O endpoint foi dividido em módulos:

```text
src/server/config.js
src/server/auth.js
src/server/rate-limit.js
src/server/validation.js
src/server/errors.js
src/server/providers/gemini.js
```

A integração Gemini mantém uma única tentativa de fallback e usa `GEMINI_TIMEOUT_MS` como timeout real.

## Variáveis

```env
APP_ENV=preview
APP_RELEASE=phase-16-security-public-readiness
PREVIEW_ACCESS_TOKEN=segredo-com-pelo-menos-16-caracteres
AI_MODE=gemini
GEMINI_API_KEY=
GEMINI_MODEL=gemini-3.5-flash-lite
GEMINI_FALLBACK_MODEL=gemini-3.1-flash-lite
GEMINI_TIMEOUT_MS=8500
MAX_IMAGE_BYTES=2097152
MAX_QUESTION_CHARS=1000
RATE_LIMIT_MAX=20
RATE_LIMIT_WINDOW_MS=60000
```

## Testes adicionados

- ausência de credencial;
- credencial arbitrária;
- credencial exata;
- timeout e limites configuráveis;
- bloqueio e renovação do rate limit;
- pergunta longa;
- MIME inválido;
- imagem acima do limite.

## Revisão de design e acessibilidade

O fluxo apresenta confirmação de privacidade antes do primeiro envio e solicita o código do piloto somente durante a sessão. Esta solução atende ao piloto controlado, mas deve evoluir para um componente visual não bloqueante e plenamente testado por teclado/leitor de tela antes de uso público amplo.

## Riscos residuais

- rate limit em memória pode variar entre instâncias Edge;
- credencial compartilhada não identifica usuários;
- `prompt()` e `confirm()` são soluções transitórias de piloto;
- cotas individuais e autenticação real permanecem para fase futura;
- a suíte precisa ser executada pela CI ou ambiente local para produzir evidência de PASS.

## Estado

```yaml
branch: feat/phase-16-security-public-readiness
implementacao: concluida_em_branch
merge: nao_autorizado
deploy_producao: nao_autorizado
auditoria: pendente_de_evidencia_da_ci
```
