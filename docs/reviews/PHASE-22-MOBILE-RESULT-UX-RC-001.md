# PHASE-22 — Mobile Result UX — RC-001

## Contexto

A revisão foi aberta após sete capturas reais do Screen Assistant no Android demonstrarem que a tela de resultado continuava difícil de usar.

## Problemas observados

1. cabeçalho fixo ocupando espaço durante toda a rolagem;
2. barra inferior cobrindo texto e botões;
3. repetição de títulos e indicadores de estado;
4. indicador de etapas sem utilidade depois da análise;
5. mensagem de análise concluída durante o carregamento;
6. cartões dentro de cartões reduzindo a área útil;
7. metadados técnicos expostos no fluxo principal;
8. ações demais com o mesmo peso visual;
9. botão de modo desktop ocupando espaço no celular;
10. resposta longa com rolagem excessiva.

## Mudanças implementadas

- resultado mobile em uma coluna;
- cabeçalho deixa de ser fixo no resultado;
- botão Modo desktop ocultado no resultado mobile;
- título externo, jornada de etapas, selo e aviso redundante ocultados;
- painel e resposta sem cartões aninhados;
- seções secundárias mantidas como expansíveis, com separadores simples;
- metadados de modelo e Request ID movidos para Detalhes técnicos;
- navegação inferior ocultada na tela de resultado;
- ações Copiar, Ouvir e Compartilhar compactadas;
- botão Interromper voz aparece apenas durante a reprodução;
- cache PWA atualizado para publicar os novos assets;
- rolagem forçada repetitiva removida.

## Arquivos

- `public/result-v22.css`
- `public/result-v22.js`
- `public/design.js`
- `public/service-worker.js`
- `tests/phase22-mobile-result.test.js`

## Evidências automatizadas

```yaml
workflow: 30778561205
job: 91578633655
tests: 91
pass: 91
fail: 0
secrets: PASS
```

## Preview técnico

```yaml
deployment: dpl_DxPmLAYD12SCqYzjSb66Ad3BL7ZZ
state: READY
runtime_errors: 0
```

## Veredito

`PASS_WITH_MOBILE_VISUAL_GATE`

A implementação cumpre os contratos automatizados, mas a aprovação final exige validação visual e tátil no mesmo celular Android usado nas capturas.

## Gate de aceitação no dispositivo

- [ ] cabeçalho não permanece ocupando a tela durante a rolagem;
- [ ] nenhuma barra inferior cobre o conteúdo;
- [ ] resposta ocupa a largura útil;
- [ ] apenas um título principal aparece;
- [ ] carregamento não mostra análise concluída;
- [ ] ações são alcançáveis e compreensíveis;
- [ ] campos e botões continuam respondendo ao toque;
- [ ] nenhuma regressão no login.

## Governança

```yaml
pr: 12
state: draft
merge: nao_autorizado
production: intacta
```
