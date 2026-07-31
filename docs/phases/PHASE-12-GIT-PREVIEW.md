# Fase 12 — Repositório Git, preview real e validação externa

## Objetivo

Preparar uma entrega versionada, publicar um preview externo isolado e comprovar que a interface e os endpoints essenciais respondem fora do ambiente local.

## Resultado executivo

| Item | Resultado |
|---|---|
| Repositório Git local | Concluído |
| Commit inicial verificável | Concluído |
| Git bundle transportável | Concluído |
| Repositório remoto no GitHub | Bloqueado: repositório ainda não existe |
| Projeto Vercel isolado | Concluído |
| Deploy com URL própria de preview | Concluído |
| Interface externa em HTTPS | HTTP 200 |
| `GET /health` | HTTP 200 |
| `GET /ready` | HTTP 200 |
| Erro normalizado no endpoint de análise | HTTP 405 no método incorreto |
| POST multipart externo | Pendente de teste manual no navegador |
| Supabase real | Não ativado |
| Gemini real | Não ativado |
| GLM real | Não ativado |

## Repositório Git

O projeto foi inicializado como repositório Git local, mantendo código, testes, documentação, configurações de deploy e artefatos necessários ao preview.

Uma cópia transportável foi criada em formato Git bundle. Esse arquivo preserva commits e branches e pode ser clonado sem depender de um servidor remoto.

### Bloqueio do GitHub

A conta GitHub conectada foi confirmada como `leon337`. Nenhum repositório acessível chamado `screen-assistant` foi encontrado.

A integração disponível consegue adicionar commits e arquivos a um repositório existente, mas não expõe uma ação para criar um repositório novo. Por isso, não foi possível publicar o remoto sem uma ação do proprietário da conta.

Ação necessária:

1. criar um repositório vazio chamado `screen-assistant` na conta `leon337`;
2. não adicionar README, licença ou `.gitignore` durante a criação;
3. retornar ao fluxo para publicação do commit existente.

## Deploy externo

### Projeto isolado

```text
Nome: screen-assistant-preview-20260731
Project ID: prj_pgIOANzKqDGkNSjQX3009kwwTgBc
Equipe: PREDIX AI BR
```

### Deploy com URL própria de preview

```text
Deployment ID: dpl_AVRcG3UvibJrrNrWjhULoEkmviwD
Estado: READY
URL: https://screen-assistant-preview-20260731-g8rkybsgp-predix-ai-br.vercel.app
```

Esse deploy não possui Supabase, Gemini, GLM, domínio personalizado ou segredos reais. O endpoint de análise funciona exclusivamente em modo simulado.

### Alias público de validação

```text
https://screen-assistant-preview-20260731.vercel.app
```

O primeiro deploy do projeto recebeu esse alias. Ele contém o mesmo harness seguro e isolado usado para validar os endpoints externamente.

## Controles de segurança do preview

- captura iniciada apenas por ação explícita do usuário;
- somente um frame por clique;
- redimensionamento e compressão no navegador;
- limite de 2 MB no endpoint;
- somente JPEG e WebP;
- nenhuma chamada a modelo de IA;
- nenhuma chave real;
- nenhuma conexão com banco de dados;
- nenhuma persistência de imagem;
- `Cache-Control: no-store` nas respostas da API;
- `X-Content-Type-Options: nosniff`;
- identificador por requisição;
- aviso visual para não compartilhar dados sensíveis.

## Validação externa executada

### Interface

```text
GET /
Resultado: 200 OK
Idioma: pt-BR
HTTPS: ativo
```

### Saúde

```text
GET /health
Resultado: 200 OK
X-Release-ID: phase-12-preview
```

Resposta:

```json
{
  "status": "success",
  "data": {
    "status": "ok",
    "service": "screen-assistant-preview"
  }
}
```

### Prontidão

```text
GET /ready
Resultado: 200 OK
Estado declarado: degraded
Modo: simulated
```

O estado `degraded` é intencional porque Gemini, GLM, fallback e circuit breaker permanecem desativados nesse preview.

### Contrato de erro

```text
GET /api/v1/analyze-screen
Resultado: 405 Method Not Allowed
```

Resposta normalizada:

```json
{
  "status": "error",
  "error": {
    "code": "METHOD_NOT_ALLOWED",
    "message": "Método não permitido.",
    "requestId": "<uuid>"
  }
}
```

### Limite da prova automatizada

A ferramenta de leitura externa utilizada aceita requisições GET, mas não envia multipart POST. O POST completo foi validado localmente contra o mesmo contrato. A prova externa final deverá ser realizada no navegador:

1. abrir o preview;
2. compartilhar uma janela de teste;
3. capturar um frame;
4. clicar em **Analisar captura**;
5. confirmar a resposta simulada;
6. testar cópia e voz.

## Supabase

Foram encontrados projetos Supabase existentes, todos inativos e com nomes associados a outros sistemas. Nenhum foi restaurado ou reutilizado para evitar impacto indevido.

A criação de um projeto novo não foi executada porque exige escolha explícita da organização e confirmação de custo pela plataforma. O preview permanece deliberadamente independente do Supabase.

## Primeira implantação classificada como produção

A primeira chamada de implantação solicitou `preview`, mas a plataforma criou o primeiro deployment do projeto com metadado de produção e atribuiu o alias público. Isso não promoveu outro aplicativo: o projeto era novo, isolado e sem domínio personalizado.

Um segundo deployment foi criado no mesmo projeto, sem alvo de produção, e recebeu uma URL única de preview.

## Conclusão

A validação externa da interface e dos endpoints públicos foi concluída. O projeto está tecnicamente pronto para ser publicado no GitHub assim que o repositório vazio for criado. A ativação de autenticação e IA reais continua fora do escopo deste preview e exige credenciais específicas.
