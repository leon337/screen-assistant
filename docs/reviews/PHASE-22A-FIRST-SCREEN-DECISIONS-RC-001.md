# PHASE-22A — RC-001 DAS DECISÕES DA PRIMEIRA TELA

## Contexto

Esta revisão avalia criticamente a proposta de simplificação da primeira tela do Screen Assistant, com foco em envio de imagem, escolha de objetivo e seleção de agente.

Base da revisão:

- capturas enviadas por Léo em 2 de agosto de 2026;
- comportamento atual da branch `feat/phase-21-design-experience`;
- `public/intent-v19.js`;
- `public/design-v21.css`;
- estado do PR #12.

## Veredito

```yaml
veredito: REQUEST_CORRECTION
critical: 0
high: 4
medium: 5
low: 1
implementacao_da_proposta_anterior: BLOQUEADA
merge: NAO_AUTORIZADO
```

A proposta anterior contém boas direções, mas não está suficientemente consistente para implementação sem correções.

## Achados de alta severidade

### H1 — A etapa obrigatória de escolha de agente é redundante

O objetivo selecionado já determina o perfil recomendado no código. Introduzir uma etapa adicional `Automático ou manual` cria uma decisão que o sistema já resolveu.

**Correção exigida:**

- fluxo principal: imagem → intenção → analisar;
- mostrar `Análise por <especialista>` como consequência;
- oferecer `Trocar especialista` como exceção.

### H2 — A proposta não elimina a estrutura de página longa

Mesmo após mover alguns itens para `Mais`, a tela ainda manteria cabeçalho, título, progresso, privacidade, envio, objetivo, agente, pergunta, CTA e navegação fixa.

**Correção exigida:** usar revelação progressiva. Cada estado mostra apenas o necessário naquele momento.

### H3 — Persistência pode abrir nova análise com agente incorreto

O contexto atual é persistido no `localStorage`. Uma nova análise pode herdar Leonardo Trader ou outro perfil da operação anterior.

**Correção exigida:**

- reiniciar intenção em nova análise; ou
- informar claramente que a última configuração foi reutilizada;
- não tratar persistência como roteamento automático.

### H4 — Onboarding do Leonardo Trader está no lugar errado

A apresentação completa do agente abre dentro do formulário e aumenta a rolagem antes da análise.

**Correção exigida:** onboarding mostrado uma única vez, em perfil/ajuda, ou em resumo recolhido fechado por padrão.

## Achados médios

### M1 — `Automático` é um rótulo abstrato

O usuário precisa saber o resultado, não o mecanismo interno.

Usar:

```text
Especialista sugerido: Leonardo Trader
[Trocar]
```

### M2 — Chips podem prejudicar clareza e acessibilidade

Objetivos precisam de rótulo e descrição curta. Lista compacta é preferível a chips sem contexto.

### M3 — Cinco objetivos simultâneos ainda geram carga cognitiva

Exibir três opções prioritárias e `Mais opções`, ou inferir categorias pela imagem.

### M4 — Barras fixas continuam duplicando ações

`Foto/Galeria` e `Início/Mais` não devem permanecer simultaneamente durante a criação da análise.

### M5 — Indicador 1–2–3 não oferece orientação suficiente

O indicador numérico consome espaço sem explicar o que falta. Substituir por estados contextuais ou removê-lo.

## Achado baixo

### L1 — Linguagem inconsistente

Há mistura entre `Escolher imagem`, `Galeria`, `Foto`, `Tirar foto`, `Analisar gráfico` e `Analisar: Analisar gráfico`.

Padronizar microcopy antes da implementação.

## Decisão revisada

### Fluxo principal

```text
1. Enviar imagem
2. Escolher o que deseja descobrir
3. Confirmar especialista sugerido apenas se desejar trocar
4. Analisar
```

Na prática, o passo 3 não é uma etapa visual obrigatória.

### Primeira tela sem imagem

Mostrar somente:

- marca compacta;
- título `O que você quer analisar?`;
- `Tirar foto`;
- `Escolher da galeria`;
- texto curto de privacidade;
- acesso secundário a histórico/conta.

### Depois da imagem

Mostrar:

- miniatura;
- `Trocar imagem`;
- objetivos compactos;
- especialista sugerido;
- pergunta opcional;
- CTA `Analisar agora`.

### Seleção de agente

```yaml
padrao: agente_sugerido_pela_intencao
controle_visivel: Trocar_especialista
lista_manual:
  - Assistente geral
  - Leonardo Trader
  - Diagnóstico técnico
  - UX e Design
  - Arquitetura
```

## Critérios de aceitação revisados

- nenhuma ação duplicada na tela;
- primeira tela cabe em uma viewport mobile comum;
- usuário consegue iniciar sem conhecer nomes de agentes;
- especialista pode ser trocado em no máximo dois toques;
- nova análise não herda silenciosamente agente anterior;
- onboarding não bloqueia o fluxo;
- apenas um CTA primário visível;
- nenhuma barra fixa cobre conteúdo;
- controles com área mínima de 44 × 44 px;
- estado selecionado perceptível sem depender apenas de cor.

## Gate

Antes de implementar:

1. produzir wireframe mobile de baixa fidelidade;
2. simular três jornadas: análise geral, interface e gráfico;
3. validar persistência e reset de contexto;
4. aprovar microcopy;
5. emitir RC-002 do wireframe.
