# PHASE-22A — Wireframe mobile revisado da primeira tela

## Objetivo

Simplificar a criação de uma análise e tornar o especialista uma consequência da intenção do usuário, não uma etapa obrigatória.

## Princípios

1. Uma ação principal por estado.
2. O usuário escolhe o objetivo; o sistema sugere o especialista.
3. Troca manual é opcional e compatível com a tarefa.
4. Não existem barras duplicadas de Foto/Galeria.
5. Não existe indicador 1–2–3 na primeira tela.
6. Onboarding completo de agente não aparece dentro do formulário.
7. Nova análise não herda silenciosamente intenção ou especialista.
8. Antes da intenção, `profileId` e `taskId` ficam nulos.
9. Controles técnicos permanecem fora da jornada principal.

## Estado A — Nenhuma imagem selecionada

```text
┌──────────────────────────────────┐
│ S  Screen Assistant         Conta│
├──────────────────────────────────┤
│ O que você quer analisar?        │
│ Envie uma foto ou captura.       │
│                                  │
│ ┌──────────────────────────────┐ │
│ │ 📷 Tirar foto               │ │
│ └──────────────────────────────┘ │
│ ┌──────────────────────────────┐ │
│ │ ▣ Escolher da galeria       │ │
│ └──────────────────────────────┘ │
│                                  │
│ Não envie senhas, documentos ou  │
│ dados financeiros.               │
└──────────────────────────────────┘
```

### Mostrar

- marca compacta;
- acesso à conta;
- título e subtítulo;
- Tirar foto;
- Escolher da galeria;
- aviso curto de privacidade.

### Não mostrar

- barra fixa Foto/Galeria;
- indicador de etapas;
- objetivos;
- escolha de agente;
- botão Analisar;
- Modo desktop;
- Instalar;
- onboarding do Leonardo Trader.

## Estado B — Imagem selecionada

```text
┌──────────────────────────────────┐
│ ‹ Nova análise              Conta│
├──────────────────────────────────┤
│ [ miniatura limitada a 180 px ]  │
│ Trocar imagem                    │
│                                  │
│ O que você quer descobrir?       │
│                                  │
│ ○ Explicar o conteúdo            │
│ ○ Encontrar um problema          │
│ ○ Analisar um gráfico            │
│   Mais opções                    │
│                                  │
│ Especialista sugerido            │
│ Leonardo Trader          [Trocar]│
│                                  │
│ Pergunta opcional                │
│ [______________________________] │
│                                  │
│ [        Analisar agora         ]│
└──────────────────────────────────┘
```

### Comportamento

- após escolher a imagem, o foco vai para `O que você quer descobrir?`;
- objetivos são lista vertical no mobile;
- `Trocar imagem` é ação textual;
- o CTA só fica ativo com imagem e intenção;
- o especialista sugerido é anunciado por região `aria-live="polite"`.

## Objetivos

### Principais

1. Explicar o conteúdo;
2. Encontrar um problema;
3. Analisar um gráfico.

### Mais opções

- Avaliar interface;
- Avaliar arquitetura.

A ordem pode ser ajustada futuramente por dados reais de uso, sem alterar o contrato de roteamento.

## Roteamento padrão

| Intenção | Perfil | Tarefa |
|---|---|---|
| Explicar o conteúdo | Assistente geral | explain |
| Encontrar um problema | Engenheiro de Software | diagnose |
| Avaliar interface | Especialista em UX | ux |
| Avaliar arquitetura | Arquiteto de Software | architecture |
| Analisar um gráfico | Leonardo Trader | trader-map-scenarios |

Antes da seleção da intenção:

```yaml
intentId: null
profileId: null
taskId: null
```

## Estado C — Troca manual de especialista

```text
┌──────────────────────────────────┐
│ ‹ Voltar   Escolher especialista │
├──────────────────────────────────┤
│ ○ Assistente geral               │
│   Leitura ampla de imagens       │
│                                  │
│ ● Leonardo Trader                │
│   Gráficos, cenários e risco     │
│                                  │
│ ○ Diagnóstico técnico            │
│   Erros, código e configuração   │
│                                  │
│ ○ UX e Design                    │
│   Interface e usabilidade        │
│                                  │
│ ○ Arquitetura                    │
│   Componentes e integrações      │
│                                  │
│ [        Confirmar escolha      ]│
└──────────────────────────────────┘
```

### Regras de compatibilidade

- troca manual não é etapa obrigatória;
- fechar ou voltar preserva a sugestão original;
- cada opção possui nome e descrição;
- seleção usa ícone, borda e texto, não apenas cor;
- alvos de toque têm no mínimo 48 px;
- ao trocar o especialista, a tarefa é recalculada para uma tarefa suportada pelo perfil;
- combinações incompatíveis não podem ser enviadas à API;
- caso não exista equivalência segura, o sistema explica e solicita nova intenção.

## Estado D — Leonardo Trader

Ao escolher `Analisar um gráfico`:

```text
Especialista sugerido
Leonardo Trader                         [Trocar]

Como deseja analisar?
[ Mapear cenários                    ▾ ]
```

A apresentação completa não aparece aberta dentro do formulário.

Acesso opcional:

```text
Conheça o Leonardo Trader
```

Esse conteúdo abre em ajuda, perfil ou painel recolhido.

## Reset de contexto

### Nova análise

- remover imagem anterior;
- remover intenção anterior;
- remover pergunta anterior;
- definir `intentId`, `profileId` e `taskId` como nulos;
- preservar profundidade somente quando o usuário tiver escolhido explicitamente essa preferência;
- não reutilizar silenciosamente qualquer agente.

### Repetir análise

- preservar imagem;
- preservar intenção;
- preservar especialista;
- preservar tarefa;
- preservar pergunta;
- exibir `Usando as mesmas configurações da análise anterior`.

## Microcopy oficial

### Estado inicial

- Título: `O que você quer analisar?`
- Subtítulo: `Envie uma foto ou captura de tela.`
- Ação 1: `Tirar foto`
- Ação 2: `Escolher da galeria`
- Privacidade: `Não envie senhas, documentos ou dados financeiros.`

### Estado com imagem

- Título: `O que você quer descobrir?`
- Especialista: `Especialista sugerido`
- Troca: `Trocar`
- Campo: `Pergunta opcional`
- CTA: `Analisar agora`

### Erros

- Sem imagem: `Escolha uma imagem para continuar.`
- Sem intenção: `Escolha o que deseja descobrir.`
- Incompatibilidade: `Este especialista não executa esse tipo de análise. Escolha outro objetivo ou especialista.`
- Falha: `Não foi possível concluir a análise. Tente novamente.`

## Simulações

### 1. Análise geral

```text
Galeria
→ imagem selecionada
→ Explicar o conteúdo
→ Assistente geral sugerido
→ Analisar agora
```

### 2. Avaliação de interface

```text
Galeria
→ imagem selecionada
→ Mais opções
→ Avaliar interface
→ Especialista em UX sugerido
→ Analisar agora
```

### 3. Gráfico

```text
Galeria
→ imagem selecionada
→ Analisar um gráfico
→ Leonardo Trader sugerido
→ Mapear cenários
→ Analisar agora
```

## Critérios de aceitação

1. Usuário inicia sem conhecer os agentes.
2. Nenhum controle é duplicado.
3. Primeira tela possui apenas duas ações de envio.
4. Objetivos surgem somente após imagem.
5. Especialista é sugerido automaticamente.
6. Troca manual é opcional e compatível.
7. Nova análise zera intenção, perfil e tarefa.
8. Repetir análise informa que preservou contexto.
9. Nenhuma barra fixa encobre conteúdo.
10. CTA exige imagem e intenção.
11. Foco e anúncios acessíveis são definidos.
12. Onboarding do Trader não amplia o formulário.

## Estado

```yaml
wireframe: corrigido
implementacao: bloqueada_ate_RC_002
merge: nao_autorizado
producao: intacta
```
