# Fase 19 — UX orientada por intenção e Leonardo Trader V2

## Estado

- Branch: `feat/phase-19-intent-trader-v2`
- Base: `feat/phase-18-redesign-r2`
- Produção: não alterada
- Merge: não autorizado
- Deploy: não autorizado

## Objetivo

Simplificar a experiência do Screen Assistant no celular e substituir prompts genéricos por contratos específicos de perfil, tarefa e profundidade.

## Jornada implementada

1. usuário escolhe a imagem;
2. escolhe o que deseja descobrir;
3. o aplicativo sugere o especialista;
4. o usuário pode ajustar especialista e profundidade;
5. a análise é enviada com `profileId`, `taskId` e `responseMode`;
6. a resposta usa o contrato da tarefa selecionada.

## Intenções disponíveis

- explicar a imagem;
- encontrar um problema;
- avaliar arquitetura;
- avaliar interface;
- analisar gráfico.

## Perfis

- Assistente geral;
- Engenheiro de Software;
- Arquiteto de Software;
- Especialista em UX;
- Leonardo Trader.

## Leonardo Trader V2

Tarefas:

- leitura rápida;
- mapear cenários;
- análise completa;
- validar setup;
- explicar indicadores;
- criar checklist.

A análise completa preserva as 11 seções aprovadas pelo Léo. A entrada é sempre hipótese educacional condicionada a contexto, confirmação, invalidação e risco.

## Segurança

- nenhuma ordem é executada;
- nenhuma direção é garantida;
- nenhum lucro é prometido;
- alavancagem e recuperação impulsiva de perdas não são incentivadas;
- dados ilegíveis não são inventados;
- qualidade do cenário não representa probabilidade de lucro;
- todo conteúdo financeiro permanece educacional e simulado.

## Alterações técnicas

### Servidor

- `src/server/expert-profiles.js`;
- validação de perfil, tarefa e profundidade;
- montagem de prompt por camadas;
- metadados do perfil e da tarefa na resposta.

### Cliente

- `public/intent-v19.js`;
- `public/intent-v19.css`;
- seleção por intenção;
- apresentação do Leonardo Trader;
- modos de análise;
- controles móveis contextuais;
- compartilhamento de tela removido da jornada mobile, preservado no desktop.

### PWA

- cache `screen-assistant-v19`;
- inclusão dos novos assets.

## Testes

A suíte cobre:

- catálogo de perfis;
- tarefas do Trader;
- limites financeiros;
- fallback seguro;
- envio do contexto especializado;
- interface por intenção;
- controles mobile;
- cache PWA;
- preservação das fases anteriores.

## Gates

- CI deve passar;
- revisão independente deve ser registrada;
- nenhuma publicação sem autorização explícita;
- nenhum merge sem autorização explícita.
