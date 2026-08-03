# PHASE-21 — Login Hotfix RC-002

**Data:** 2026-08-02 22:52 BRT  
**Autoridade:** Léo  
**Branch:** `feat/phase-21-design-experience`  
**PR:** #12

## Incidente

Na validação mobile, os campos de e-mail e senha eram exibidos, mas não recebiam foco nem permitiam digitação.

## Evidência de entrada

- captura real do aparelho;
- campos visualmente habilitados;
- ausência de mensagens de validação;
- falha simultânea nos dois campos.

## Causa técnica

A camada `design-v21.js` instalava um `MutationObserver` sobre o corpo da página e, durante cada callback, reescrevia textos e conteúdo HTML. Essas próprias escritas podiam produzir novas mutações e manter a thread principal ocupada.

Além disso, a PWA poderia continuar servindo o JavaScript defeituoso do cache anterior mesmo após o novo deployment.

## Correções

### Interação

- a camada visual aguarda `data-auth-state="authenticated"`;
- nenhuma observação ou mutação visual ocorre durante o login;
- textos e HTML só são alterados quando o valor realmente muda;
- sincronizações são agrupadas por `requestAnimationFrame`;
- o observador de autenticação é desconectado após a entrada.

Commit:

`484b3783cf45b7eadd8ad27990e2eb6a50d68d7d`

### Cache PWA

- cache atualizado para `screen-assistant-v21-design-experience-hotfix-1`;
- caches anteriores são removidos durante a ativação;
- o navegador é obrigado a baixar o novo `design-v21.js`.

Commit:

`4f598b98d19b11fdf7249a2b2c4f8d7e672613d5`

### Testes

Foram adicionados controles para:

- impedir alteração da tela de login;
- aguardar autenticação antes de iniciar o redesign;
- garantir escritas idempotentes no DOM;
- agrupar sincronizações;
- exigir invalidação do cache anterior.

HEAD testado:

`d8d2986282dca322bb160bc1384f6aac6fd26054`

```yaml
workflow: 30777877323
job: 91576732264
tests: 85
pass: 85
fail: 0
secrets: PASS
```

## Preview

```yaml
deployment: dpl_EDkzoLiPex1emRte1QjL5RvdZedK
state: READY
runtime_error: 0
runtime_fatal: 0
```

## Veredito

```yaml
veredito: PASS_WITH_DEVICE_VALIDATION_GATE
critical: 0
high: 0
medium: 1
low: 0
```

A ressalva média é exclusivamente a validação tátil no mesmo aparelho e navegador em que o incidente foi observado.

## Gate de aceite

O hotfix será considerado funcionalmente confirmado quando o usuário conseguir:

1. tocar no campo E-mail;
2. visualizar o teclado;
3. digitar texto;
4. tocar no campo Senha;
5. digitar a senha;
6. alternar para Criar conta.

## Governança

```yaml
merge: nao_autorizado
production: intacta
pr: draft
```
