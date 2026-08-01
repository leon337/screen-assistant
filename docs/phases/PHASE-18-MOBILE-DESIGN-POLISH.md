# Fase 18 — Refinamento visual mobile

## Objetivo

Melhorar a experiência do Screen Assistant em celulares sem alterar a integração Gemini, o contrato da API ou os controles de segurança existentes.

## Evidência de origem

A fase foi motivada pela avaliação visual da aplicação publicada em um celular Android. Foram observados:

- barra fixa inferior competindo com a leitura do resultado;
- risco de sobreposição quando o teclado virtual está aberto;
- excesso de altura e espaçamento em cartões mobile;
- painel de compartilhamento de tela ocupando espaço apesar de ser descrito como recurso para computador;
- ações e metadados distribuídos em uma página longa;
- necessidade de preservar alvos de toque adequados.

## Implementação

### Camada visual

Foi adicionado `public/mobile-v18.css`, carregado como uma camada de refinamento sobre o sistema visual existente.

A camada:

- reduz margens, paddings e alturas no mobile;
- mantém botões com alvos de toque de pelo menos 44 px;
- organiza câmera e galeria lado a lado;
- compacta o painel operacional;
- reduz a altura mínima da prévia e da resposta;
- oculta o painel de compartilhamento de tela somente no modo compacto;
- preserva o recurso quando o modo desktop é utilizado;
- respeita `safe-area-inset-bottom`.

### Contexto da barra móvel

Foi adicionado `public/mobile-v18.js`.

O módulo:

- detecta quando o usuário está lendo um resultado;
- recolhe a barra inferior nesse contexto;
- detecta a abertura provável do teclado pelo `visualViewport`;
- recolhe a barra durante a digitação;
- fecha o painel de compartilhamento de tela no modo compacto;
- não remove elementos nem altera os handlers existentes.

### PWA

O cache foi atualizado para `screen-assistant-v18` e passou a incluir os dois novos arquivos.

## Segurança

Esta fase não remove, ignora nem modifica a autenticação do piloto. A correção relacionada a caracteres incompatíveis no token permanece registrada como trabalho separado.

Nenhum segredo foi incluído no código ou na documentação.

## Revisões previstas

- **Laura:** hierarquia, densidade e clareza visual;
- **Isabela:** regressão funcional e preservação dos controles;
- **Acessibilidade:** foco, tamanho dos alvos, contraste e comportamento com teclado;
- **Sofia:** integração sem acoplamento ao runtime principal;
- **Carmem:** documentação;
- **Emily:** auditoria independente e conferência da CI.

## Critérios de aceite

- CI integral aprovada;
- nenhum recurso desktop removido;
- barra móvel não cobre o resultado durante a leitura;
- barra móvel não compete com o teclado virtual;
- painel operacional continua disponível;
- assets da Fase 18 presentes no cache PWA;
- merge e publicação somente após autorização explícita do Léo.

## Estado

```yaml
fase: 18
branch: feat/phase-18-mobile-design-polish
merge: nao_autorizado
publicacao: nao_autorizada
seguranca_do_token: pendencia_separada
```
