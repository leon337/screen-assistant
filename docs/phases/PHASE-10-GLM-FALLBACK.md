# Fase 10 — GLM e fallback entre provedores

## Objetivo

Adicionar um segundo provedor visual sem acoplar o endpoint ao fornecedor e garantir uma única tentativa alternativa quando o Gemini falhar temporariamente.

## Implementação

- `GlmProvider` usando `POST /api/paas/v4/chat/completions`;
- modelo padrão `glm-4.6v-flash`;
- imagem enviada como data URL Base64 no campo `image_url`;
- chave GLM apenas no Worker, via `Authorization: Bearer`;
- `ProviderRouter` com Gemini primário e GLM secundário;
- modos `simulated`, `gemini`, `glm` e `fallback`;
- resposta informa provedor final, modelo e se houve fallback;
- nenhum armazenamento de screenshot;
- no máximo duas chamadas por análise no modo `fallback`.

## Política de fallback

O GLM é chamado somente quando o Gemini retorna:

- `PROVIDER_TIMEOUT`;
- `PROVIDER_RATE_LIMITED`;
- `PROVIDER_UNAVAILABLE`.

O fallback não ocorre em:

- configuração inválida;
- conteúdo rejeitado por segurança;
- entrada inválida;
- resposta vazia ou não processável;
- falhas de autenticação do usuário.

## Segurança

- chaves não aparecem na URL nem no frontend;
- o corpo da imagem permanece apenas em memória;
- o roteador não cria ciclos nem novas tentativas;
- `thinking` foi desativado no GLM para reduzir latência e evitar conteúdo de raciocínio na resposta;
- erros externos são convertidos para os códigos internos já existentes.

## Configuração

```text
AI_MODE=fallback
GEMINI_API_KEY=<segredo>
GEMINI_MODEL=gemini-3.5-flash
GLM_API_KEY=<segredo>
GLM_MODEL=glm-4.6v-flash
GLM_TIMEOUT_MS=25000
```

## Resultado

A integração foi validada com servidores controlados. Nenhuma chamada real foi feita, pois não havia credenciais reais no ambiente.

## Validação final

- `format:check`: PASS;
- `lint`: PASS;
- `typecheck`: PASS;
- `build`: PASS;
- testes: 55/55 PASS;
- verificação de segredos: PASS;
- prova HTTP controlada Gemini → GLM: PASS;
- chamadas externas reais: 0;
- consumo de cota real: 0.

A prova ponta a ponta forçou um `429` no Gemini controlado. O roteador classificou a falha como `PROVIDER_RATE_LIMITED`, realizou somente uma tentativa alternativa e devolveu a resposta do GLM com os metadados de fallback.

## Limitações abertas

- a primeira chamada contra a API real da Z.AI depende de uma chave válida;
- as cotas gratuitas podem ser alteradas pelo provedor;
- o payload Base64 deve ser confirmado em uma conta real antes do deploy de produção;
- o fallback dobra o número máximo de chamadas externas em uma análise elegível, portanto deve permanecer protegido por autenticação e rate limit.
