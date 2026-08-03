# PHASE-22A — Wireframe mobile revisado da primeira tela

## Objetivo

Simplificar a criação de uma análise no Screen Assistant e tornar a escolha do especialista uma consequência da intenção do usuário, não uma etapa obrigatória.

## Princípios

1. Uma ação principal por estado.
2. O usuário escolhe o objetivo; o sistema sugere o especialista.
3. A troca manual de especialista é opcional.
4. Nada de barras duplicadas para Foto/Galeria.
5. Nada de indicador 1–2–3 na primeira tela.
6. Nada de onboarding completo do agente dentro do formulário.
7. Nova análise não herda silenciosamente o especialista anterior.
8. Controles técnicos ficam fora da jornada principal.

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
│ Sua imagem será processada com   │
│ segurança. Não envie senhas,     │
│ documentos ou dados financeiros. │
└──────────────────────────────────┘
```

### Elementos permitidos

- marca compacta;
- acesso à conta;
- título e subtítulo;
- Tirar foto;
- Escolher da galeria;
- texto curto de privacidade.

### Elementos proibidos

- barra fixa Foto/Galeria;
- indicador 1–2–3;
- escolha de agente;
- lista de objetivos;
- botão Analisar;
- Modo desktop;
- Instalar;
- onboarding do Leonardo Trader.

## Estado B — Imagem selecionada

```text
┌──────────────────────────────────┐
│ ‹ Nova análise              Conta│
├──────────────────────────────────┤
│ [ miniatura da imagem ]          │
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

### Objetivos principais

Exibir três objetivos prioritários:

1. Explicar o conteúdo;
2. Encontrar um problema;
3. Analisar um gráfico.

`Mais opções` revela:

- Avaliar interface;
- Avaliar arquitetura.

### Roteamento padrão

| Intenção | Especialista sugerido |
|---|---|
| Explicar o conteúdo | Assistente geral |
| Encontrar um problema | Engenheiro de Software |
| Avaliar interface | Especialista em UX |
| Avaliar arquitetura | Arquiteto de Software |
| Analisar um gráfico | Leonardo Trader |

## Estado C — Troca manual de especialista

```text
┌──────────────────────────────────┐
│ Escolher especialista         ×  │
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

### Regras

- a troca manual não é etapa obrigatória;
- o usuário pode fechar sem alterar a sugestão;
- cada opção possui nome e explicação;
- seleção não depende apenas de cor;
- alvos de toque com no mínimo 48 px.

## Estado D — Leonardo Trader

Ao escolher `Analisar um gráfico`:

```text
Especialista sugerido
Leonardo Trader                         [Trocar]

Como deseja analisar?
[ Mapear cenários                    ▾ ]
```

A apresentação completa do Leonardo Trader não aparece aberta no formulário.

Acesso opcional:

```text
Conheça o Leonardo Trader
```

Esse conteúdo abre em ajuda, perfil ou painel recolhido.

## Reset de contexto

### Nova análise

Ao tocar em `Nova análise`:

- remover imagem anterior;
- remover intenção anterior;
- remover pergunta anterior;
- voltar ao Assistente geral como estado neutro;
- preservar somente preferência de profundidade quando explicitamente escolhida pelo usuário;
- não reutilizar silenciosamente Leonardo Trader ou outro agente.

### Repetir análise

Ao tocar em `Repetir análise`:

- preservar imagem;
- preservar intenção;
- preservar especialista;
- preservar pergunta;
- informar visualmente que o contexto foi mantido.

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
- Falha de análise: `Não foi possível concluir a análise. Tente novamente.`

## Simulação 1 — Análise geral

```text
Galeria
→ imagem selecionada
→ Explicar o conteúdo
→ Assistente geral sugerido
→ Analisar agora
```

Resultado esperado: nenhuma escolha manual de agente.

## Simulação 2 — Avaliação de interface

```text
Galeria
→ imagem selecionada
→ Mais opções
→ Avaliar interface
→ Especialista em UX sugerido
→ Analisar agora
```

Resultado esperado: o especialista aparece como consequência da intenção.

## Simulação 3 — Gráfico

```text
Galeria
→ imagem selecionada
→ Analisar um gráfico
→ Leonardo Trader sugerido
→ Mapear cenários
→ Analisar agora
```

Resultado esperado: o modo do Trader aparece sem abrir o onboarding completo.

## Critérios de aceitação

1. Usuário consegue iniciar sem conhecer os agentes.
2. Nenhum controle é duplicado.
3. A primeira tela possui apenas as duas ações de envio.
4. Objetivos só aparecem após selecionar imagem.
5. Especialista é sugerido automaticamente.
6. Troca manual é opcional.
7. Nova análise reseta agente e intenção.
8. Repetir análise preserva contexto com indicação visível.
9. Nenhuma barra fixa encobre conteúdo.
10. O CTA só fica disponível com imagem e intenção.

## Estado

```yaml
wireframe: pronto_para_RC
implementacao: bloqueada
merge: nao_autorizado
producao: intacta
```
