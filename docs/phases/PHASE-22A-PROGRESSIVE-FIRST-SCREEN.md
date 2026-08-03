# Fase 22A — Primeira tela progressiva

## Objetivo

Simplificar a criação de uma análise no celular, removendo decisões e controles antes do momento em que são necessários.

## Fluxo implementado

```text
Enviar imagem
→ escolher intenção
→ receber especialista sugerido
→ analisar
```

A escolha manual do especialista é opcional.

## Estado inicial

Sem imagem, a tela mostra apenas:

- marca e conta;
- título `O que você quer analisar?`;
- `Tirar foto`;
- `Escolher da galeria`;
- aviso curto de privacidade.

Não são mostrados:

- objetivos;
- especialista;
- pergunta;
- botão Analisar;
- indicador 1–2–3;
- barras fixas de Foto/Galeria e navegação;
- Instalar e Modo desktop no mobile.

## Depois da imagem

A tela revela:

- miniatura limitada;
- `Trocar imagem`;
- três intenções principais;
- `Mais opções`;
- especialista sugerido;
- troca manual opcional;
- pergunta opcional;
- `Analisar agora`.

## Roteamento

```yaml
explicar:
  perfil: general
  tarefa: explain
problema:
  perfil: software-engineer
  tarefa: diagnose
grafico:
  perfil: trader-analyst
  tarefa: trader-map-scenarios
interface:
  perfil: ux-specialist
  tarefa: ux
arquitetura:
  perfil: software-architect
  tarefa: architecture
```

A troca manual seleciona um perfil e recalcula a intenção e a tarefa correspondentes. Combinações incompatíveis não são mantidas.

## Contexto

Uma nova análise inicia com:

```yaml
intentId: null
profileId: null
taskId: null
responseMode: standard
```

Somente a profundidade da resposta pode permanecer como preferência.

`Nova análise` limpa:

- imagem;
- intenção;
- perfil;
- tarefa;
- pergunta;
- resposta.

`Repetir análise` preserva o contexto atual.

## Acessibilidade

- foco movido para o título dos objetivos após selecionar imagem;
- sugestão de especialista anunciada por `aria-live`;
- troca manual em diálogo com ação Voltar;
- opções com área mínima de toque;
- seleção indicada por texto, estado ARIA e borda;
- suporte a `prefers-reduced-motion`.

## Arquivos

- `public/intent-v22a.js`;
- `public/first-screen-v22a.js`;
- `public/first-screen-v22a.css`;
- `public/analysis.js`;
- `public/app.js`;
- `public/design-v21.js`;
- `public/design.js`;
- `public/service-worker.js`;
- `tests/phase22a-progressive-first-screen.test.js`.

## Governança

```yaml
branch: feat/phase-22a-progressive-first-screen
base: main
merge: NAO_AUTORIZADO
producao: INTACTA
preview: PENDENTE_DE_CI
RC_003: PENDENTE
```
