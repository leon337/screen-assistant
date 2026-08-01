# Fase 17 — Atualizações visíveis e estado operacional

## Objetivo

Tornar o estado real da aplicação visível dentro da própria interface, reduzindo dependência de explicações externas e permitindo que o usuário confirme publicação, API, código do piloto, release e ambiente.

## Escopo implementado

- endpoint público `GET /api/v1/status`;
- painel visível logo após o aviso de privacidade;
- atualização manual do estado;
- indicação separada para interface, API Gemini e código do piloto;
- release, ambiente e horário da última verificação;
- mensagens compreensíveis para estado pronto, pendente ou indisponível;
- nenhuma exposição do valor de `PREVIEW_ACCESS_TOKEN` ou `GEMINI_API_KEY`;
- PWA atualizada para incluir os arquivos da Fase 17.

## Contrato do endpoint

O endpoint retorna somente metadados operacionais:

- release;
- ambiente;
- prontidão geral;
- booleano de configuração do acesso;
- booleano de configuração do Gemini;
- modelos configurados;
- limites públicos da requisição;
- horário da verificação.

Valores de segredos não fazem parte da resposta.

## Revisões especializadas

### Laura — experiência e clareza

O painel usa linguagem direta, separa os estados por responsabilidade e oferece atualização explícita sem esconder a jornada principal.

### Isabela — consistência funcional

A funcionalidade é isolada em módulo próprio e não modifica seleção de imagem, captura de tela, análise, cópia, voz ou PWA existente.

### Acessibilidade

- região de status com `aria-live="polite"`;
- títulos e lista descritiva com `dl`, `dt` e `dd`;
- botão de atualização com texto completo;
- estados não dependem apenas de cor;
- layout responsivo até telas estreitas.

### Sofia — arquitetura

A leitura de prontidão é derivada da configuração do servidor. O cliente recebe somente booleanos e metadados não sensíveis. O endpoint usa `cache-control: no-store` para evitar estado obsoleto.

## Riscos residuais

- o painel informa que a variável existe, mas não testa uma análise completa com imagem;
- indisponibilidade de rede pode impedir a consulta sem indicar falha real da aplicação;
- o endpoint público revela nomes dos modelos e limites operacionais, considerados metadados aceitáveis para este piloto;
- a configuração da variável na Vercel continua sendo uma ação administrativa externa.

## Critérios de aceite

- painel aparece automaticamente na interface;
- estado pode ser atualizado manualmente;
- ausência de `PREVIEW_ACCESS_TOKEN` fica claramente visível;
- nenhum segredo é retornado pelo endpoint;
- testes anteriores continuam aprovados;
- novos testes da Fase 17 aprovados;
- CI e auditoria independente concluídas antes de merge.

## Estado

```yaml
fase: 17
branch: feat/phase-17-visible-operational-status
merge: pendente_de_decisao_do_leo
publicacao: nao_autorizada
```
