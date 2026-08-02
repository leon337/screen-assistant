# Fase 16 — Especialistas de análise

## Objetivo

Permitir que o usuário escolha a perspectiva profissional usada na análise de uma imagem, sem alterar o fluxo de captura, câmera, galeria, compressão, voz ou fallback do Gemini.

## Perfis do MVP

- Assistente geral;
- Engenheiro de Software;
- Arquiteto de Software;
- Trader analítico;
- Especialista em UX.

## Fluxo

```text
Escolher especialista
→ selecionar ou capturar imagem
→ escrever pergunta opcional
→ analisar
→ identificar o especialista no resultado
→ reanalisar a mesma imagem com outro especialista
```

## Arquitetura

O navegador envia somente `profileId`. O catálogo de instruções permanece em `src/server/expert-profiles.js`. O servidor valida o identificador e usa `general` como fallback quando o valor não pertence ao catálogo permitido.

## Segurança

- instruções completas não são recebidas do navegador;
- perfis desconhecidos não são interpolados no prompt;
- regras compartilhadas impedem invenção de conteúdo ilegível;
- o perfil Trader é educacional, não garante resultado e não recomenda compra, venda, aposta, alavancagem ou tamanho de posição;
- a resposta informa qual perfil foi efetivamente utilizado.

## Experiência

O seletor é instalado progressivamente pelo módulo `public/expert-profiles.js`. A escolha é preservada localmente no navegador. A ação `Reanalisar com outro especialista` reutiliza a imagem atual e exige uma nova escolha antes de repetir a análise.

## Critérios de aceite

- cinco perfis visíveis e selecionáveis;
- `profileId` enviado no `FormData`;
- perfil validado no servidor;
- fallback seguro para `general`;
- especialista visível nos metadados do resultado;
- reanálise sem nova captura;
- controles acessíveis por teclado;
- alvos móveis com altura mínima adequada;
- testes automatizados em PASS;
- nenhuma alteração direta na `main` ou produção.
