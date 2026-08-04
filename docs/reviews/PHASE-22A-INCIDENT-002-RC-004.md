# RC-004 — Incidente 002 da Fase 22A

**Objeto:** falha ao tocar em `Analisar outra imagem`  
**Data:** 3 de agosto de 2026  
**Branch:** `feat/phase-22a-progressive-first-screen`  
**PR:** #13

## Evidência do incidente

A validação no celular mostrou que o botão limpava a resposta, mas mantinha a rota de resultado ativa:

```text
Resultado da análise
Aguardando análise.
```

Isso deixava o usuário sem acesso imediato à câmera ou galeria.

## Causa confirmada

O reset funcional e a navegação estavam distribuídos entre módulos distintos. O reset ocorreu; a transição para `analyze` não permaneceu ativa de forma confiável.

## Correção revisada

A camada `first-screen-v22a.js` agora ativa explicitamente a rota `analyze` nas ações:

- `Analisar outra imagem`;
- `Usar outra imagem`.

A correção:

- define `data-premium-screen="analyze"`;
- mostra `premium-screen-analyze`;
- oculta `premium-screen-result` e `premium-screen-status`;
- sincroniza `aria-hidden`, aba ativa e `aria-current`;
- atualiza a URL para `#analyze`;
- retorna ao topo.

## Evidências técnicas

```yaml
commit_funcional: 10e4836726985fdce1f93fd2e19c46cc99ff0525
commit_teste: d9177070d39b25f2e1d91f5614aa849c42302d62
commit_cache: bf31abc6208308f2a872d84b7aa5b2815578feab
commit_incidente: 9caac041542473b8b4c6c992d16b15e61cf087fe
workflow: 30788665479
job: 91607437571
testes: 106
aprovados: 106
falhas: 0
segredos: PASS
```

## Preview funcional

```yaml
deployment: dpl_ADVUFU6DwtjeQjtZ8YFuo4fhYQyy
commit: 10e4836726985fdce1f93fd2e19c46cc99ff0525
estado: READY
dominio: exclusivo
cache_anterior: nao_reutilizado
```

## Achados

```yaml
critical: 0
high: 0
medium: 1
low: 0
```

### M-001 — confirmação no dispositivo real

O teste automatizado protege a estrutura da transição, mas o aceite final depende de confirmar no celular:

1. concluir análise;
2. tocar em `Analisar outra imagem`;
3. verificar retorno à câmera/galeria;
4. selecionar outra imagem;
5. executar a segunda análise;
6. repetir com `Usar outra imagem`.

## Veredito

```yaml
veredito: PASS_WITH_DEVICE_CONFIRMATION
merge: NAO_AUTORIZADO
producao: INTACTA
proxima_acao: validacao_no_celular
```
