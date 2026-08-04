# Fase 24A — Incidente 004 — barra de voz ausente no desktop

## Evidência real

O usuário enviou uma captura integral do Screen Assistant aberto no computador. A tela continha uma análise concluída e as ações de resultado, porém não apresentava:

- barra universal de voz;
- botão `Mic`;
- botão `Ouvir/Parar`;
- velocidade;
- botão `Ajustes`.

## Impacto

```yaml
Android: PASS
Desktop: FAIL_CONFIRMED
leitura_por_voz: INACESSIVEL_PELA_INTERFACE
comandos_por_voz: INACESSIVEIS_PELA_INTERFACE
merge: BLOQUEADO_PELO_GATE_DESKTOP
```

## Causa

O módulo visual original exibia o dock apenas quando:

```javascript
document.body.dataset.premiumScreen === 'result' && answerReady()
```

No layout desktop, análise e resultado podem permanecer visíveis ao mesmo tempo. A existência de resposta pronta não garante que `premiumScreen` permaneça com o valor `result`. Como consequência, o dock recebia `hidden` mesmo com o resultado visível.

A captura também mostrava `AMBIENTE: production` e `RELEASE: phase-20-saas-auth`. Isso é um indício de URL ou cache anterior, mas não foi usado como causa única porque o defeito de condição também existia no código.

## Correção

Arquivo novo:

```text
public/voice-desktop-dock-hotfix-v24a.js
```

Regras:

- no desktop, a visibilidade depende de uma resposta pronta;
- a rota compacta ativa não bloqueia o dock;
- um observador acompanha `aria-busy` e o conteúdo da resposta;
- outro observador remove `hidden` caso uma camada anterior volte a aplicá-lo;
- a inicialização tolera criação tardia da barra;
- falha em localizar o dock produz marcador e erro verificável no console.

## PWA

```yaml
cache_anterior: screen-assistant-v24a-desktop-voice-1
cache_novo: screen-assistant-v24a-desktop-dock-hotfix-1
```

## Testes

Arquivo:

```text
tests/phase24a-desktop-dock-hotfix.test.js
```

Cobertura:

- independência de `premiumScreen` no desktop;
- recuperação após `hidden` indevido;
- observação da resposta e do estado da aplicação;
- inicialização tardia;
- ordem de carregamento;
- publicação na PWA.

## Estado

```yaml
classe: RECUPERAVEL
efeito_em_main: nenhum
efeito_em_producao: nenhum_deployment_autorizado
estado: AGUARDANDO_CI_E_PREVIEW
```
