# Segurança e privacidade

## Modelo de privacidade

O usuário controla a origem da imagem. A aplicação não inicia captura automaticamente.

```text
ação explícita
→ imagem selecionada
→ compressão local
→ envio temporário
→ análise
→ descarte pelo código da aplicação
```

## Dados processados

- imagem escolhida ou frame capturado;
- pergunta opcional;
- identificador aleatório da requisição;
- resposta textual do modelo.

## Dados não persistidos intencionalmente

- screenshots;
- fotos;
- conteúdo Base64;
- perguntas;
- respostas;
- voz.

## Controles

- limite de 2 MB;
- somente JPEG e WebP;
- chave no backend;
- `Cache-Control: no-store`;
- service worker ignora `/api`, `/ready` e `/health`;
- HTML escapado;
- links limitados a HTTP, HTTPS e `mailto`;
- microfone e geolocalização desabilitados por Permissions Policy.

## Limitações

O código da aplicação não persiste imagens, mas o processamento externo está sujeito às políticas do provedor e da hospedagem. Para uso com dados regulados, é necessária revisão jurídica e contratual.

## Recomendação ao usuário

Não analisar:

- senhas;
- dados bancários;
- documentos pessoais;
- chaves de API;
- informações confidenciais de terceiros.
