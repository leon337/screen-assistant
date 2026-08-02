# Fase 19 — UX orientada por intenção e prompts especializados

## Objetivo

Simplificar a experiência mobile do Screen Assistant e substituir respostas excessivamente genéricas por contratos específicos de agente e tarefa.

## Evidência de origem

A fase foi motivada por capturas reais da aplicação em um celular Android e por revisão do código atual.

Problemas observados:

- estado operacional, release, ambiente e configuração aparecem antes da tarefa principal;
- compartilhamento de tela ocupa espaço no celular apesar de ser recurso para computador;
- Foto, Galeria, Analisar, Atualizar estado, Modo desktop e Nova análise competem visualmente;
- painel de resultado vazio apresenta ações desabilitadas antes de existir resposta;
- seletor de especialista aparece dentro de uma etapa longa e sem explicar claramente o efeito;
- barra inferior repete ações já presentes no conteúdo;
- respostas seguem estrutura genérica mesmo quando o perfil é especializado.

## Diagnóstico técnico

A `main` obriga as seções `Resumo`, `Observação direta` e `Interpretação`.

A branch `feat/phase-16-selectable-expert-profiles` mantém essa estrutura obrigatória e acrescenta seções de cada perfil. Isso pode duplicar conteúdo e aumentar a resposta.

Também existem duas propostas de Fase 18 e uma branch de perfis especialistas à frente da `main`. Antes da implementação da Fase 19, o estado dessas branches deve ser consolidado.

## Jornada proposta

### Etapa 1 — Escolher a imagem

No mobile, mostrar somente:

- Tirar foto;
- Escolher da galeria.

Captura de tela deve aparecer apenas no desktop ou em área secundária.

### Etapa 2 — Definir o objetivo

Pergunta principal:

> O que você quer descobrir nesta imagem?

Atalhos:

- Explicar a imagem;
- Encontrar um problema;
- Ler código ou erro;
- Avaliar interface;
- Analisar gráfico;
- Fazer outra pergunta.

O atalho seleciona automaticamente o perfil recomendado. O usuário pode trocar o especialista em uma opção secundária.

### Etapa 3 — Resultado

Mostrar primeiro:

- resposta direta;
- evidência principal;
- próxima ação sugerida.

Detalhes adicionais ficam recolhidos. Copiar, ouvir e compartilhar só aparecem quando existe resposta.

## Separação de áreas

### Jornada do usuário

- imagem;
- objetivo;
- especialista recomendado;
- análise;
- resultado.

### Área operacional

Mover para `Mais > Estado do sistema`:

- interface publicada;
- API;
- código do piloto;
- release;
- ambiente;
- modelo;
- request ID.

## Arquitetura de prompts

```text
POLÍTICA BASE
  verdade, legibilidade, privacidade e segurança
        ↓
PERFIL DO AGENTE
  função, competência e limites
        ↓
TAREFA SELECIONADA
  objetivo específico do usuário
        ↓
CONTRATO DE RESPOSTA
  campos próprios da tarefa
        ↓
PERGUNTA DO USUÁRIO
```

A política-base não deve impor títulos de resposta.

## Contrato técnico sugerido

Entrada:

```json
{
  "profileId": "trader-analyst",
  "taskId": "map-scenarios",
  "question": "texto do usuário",
  "responseMode": "concise"
}
```

Saída interna:

```yaml
summary:
observations:
analysis:
scenarios:
recommended_next_step:
missing_data:
warnings:
```

A interface decide quais campos ficam visíveis ou recolhidos.

## Agente Trader — modos iniciais

### Leitura rápida

- ativo e período, quando legíveis;
- direção aparente;
- níveis principais;
- principal alerta;
- dados não confirmados.

### Mapear cenários

- cenário de alta;
- cenário neutro;
- cenário de baixa;
- condição de ativação;
- condição de invalidação;
- riscos.

### Validar meu setup

```yaml
condicoes_atendidas:
condicoes_nao_atendidas:
condicoes_nao_confirmadas:
resultado_do_checklist:
dados_faltantes:
```

### Explicar indicadores

Explica indicadores visíveis e interpretação educacional, sem previsão garantida.

### Preparar checklist

Transforma regras informadas pelo usuário em checklist reutilizável.

## Limites do Trader

- não executar ordens;
- não prometer lucro;
- não garantir direção;
- não sugerir alavancagem;
- não definir tamanho de posição;
- não tratar dado ilegível como fato;
- manter caráter educacional e analítico.

## Backlog priorizado

### P0 — antes de implementar

1. Consolidar branches de perfis e Fase 18.
2. Definir tarefas exatas desejadas para o Trader.
3. Aprovar o fluxo mobile de três etapas.

### P1 — UX

1. Remover estado operacional da tela principal.
2. Ocultar compartilhamento de tela no mobile.
3. Tornar barra inferior contextual.
4. Remover painel de resultado vazio.
5. Selecionar objetivo antes do especialista.

### P1 — prompts

1. Separar política-base de estrutura de resposta.
2. Adicionar `taskId` e `responseMode`.
3. Criar contratos por agente e tarefa.
4. Validar saída estruturada no servidor.
5. Renderizar resumo primeiro e detalhes recolhidos.

## Critérios de aceite

- usuário entende a ação principal sem rolar a página;
- no máximo uma ação primária por estado;
- itens operacionais não competem com a análise;
- perfil recomendado pode ser alterado;
- respostas do Trader não repetem seções genéricas;
- resposta rápida cabe na primeira tela do resultado;
- detalhes permanecem acessíveis;
- testes de regressão desktop e mobile aprovados;
- nenhuma operação financeira real é executada;
- merge e publicação exigem autorização explícita.

## Estado

```yaml
fase: 19
branch: docs/phase-19-ux-agent-prompts
implementacao: nao_iniciada
merge: nao_autorizado
publicacao: nao_autorizada
```