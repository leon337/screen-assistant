# Fase 22A — Incidente 002: reinício preso na tela de resultado

**Data:** 3 de agosto de 2026  
**Origem:** validação no dispositivo real por Léo  
**Estado:** corrigido na branch, aguardando confirmação no aparelho

## Sintoma observado

Depois de concluir uma análise e tocar em **Analisar outra imagem**, o aplicativo limpava a resposta e mostrava:

```text
Resultado da análise
Aguardando análise.
```

Entretanto, permanecia na tela de resultado e não voltava para a área de câmera ou galeria.

## Diagnóstico

O fluxo estava dividido entre duas responsabilidades:

```text
app.js
→ limpar imagem, pergunta, contexto e resposta

premium-v18.js
→ mudar da rota Resultado para Analisar
```

A captura confirmou que o reset funcional ocorreu, mas a transição de rota não permaneceu ativa. Assim, o usuário ficava em um resultado vazio sem conseguir iniciar a próxima análise.

## Classificação CAF

```yaml
objetivo: SCREEN-PHASE-22A-NEW-ANALYSIS-RESET
parent_mission_id: SCREEN-PHASE-22A-FIRST-SCREEN
estado: RECUPERANDO
falha_atual: reset_sem_retorno_confiavel_para_rota_analyze
classe_da_falha: RECUPERAVEL
efeito_confirmado: estado_limpo_com_tela_de_resultado_ainda_ativa
recuperacao_escolhida: ativar_rota_analyze_na_camada_da_fase_22A
proxima_acao: validar_no_celular
destinatario: Leo
```

## Correção

A camada `first-screen-v22a.js` passou a tratar explicitamente as ações:

- `Analisar outra imagem`;
- `Usar outra imagem`.

Ao tocar, a aplicação agora:

1. define `data-premium-screen="analyze"`;
2. ativa `premium-screen-analyze`;
3. desativa `premium-screen-result` e `premium-screen-status`;
4. sincroniza a navegação;
5. atualiza a URL para `#analyze`;
6. retorna ao topo da jornada.

O reset completo existente continua responsável por limpar imagem, pergunta, objetivo, agente, tarefa e resposta.

## Evidências

```yaml
correcao_funcional: 10e4836726985fdce1f93fd2e19c46cc99ff0525
teste_regressao: d9177070d39b25f2e1d91f5614aa849c42302d62
cache_PWA: bf31abc6208308f2a872d84b7aa5b2815578feab
branch: feat/phase-22a-progressive-first-screen
PR: 13
merge: NAO_AUTORIZADO
producao: INTACTA
```

## Critérios de validação no dispositivo

```text
1. concluir uma análise;
2. tocar em Analisar outra imagem;
3. confirmar retorno imediato à tela de Foto/Galeria;
4. selecionar uma nova imagem;
5. escolher a intenção;
6. executar uma nova análise;
7. repetir usando Usar outra imagem.
```
