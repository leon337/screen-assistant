# Política de segurança

## Segredos

Nunca registre no GitHub:

- `GEMINI_API_KEY`;
- arquivos `.env` reais;
- tokens da Vercel;
- capturas contendo senhas, dados bancários ou documentos pessoais.

A chave Gemini deve existir apenas como variável de ambiente protegida na Vercel ou em `.env.local` durante desenvolvimento local.

## Relato de vulnerabilidade

Não publique chaves, tokens ou imagens sensíveis em Issues públicas. Abra uma Issue sem o segredo e solicite um canal privado ao mantenedor.

## Controles implementados

- análise somente por `POST`;
- imagem limitada a 2 MB;
- formatos aceitos: WebP e JPEG;
- `Cache-Control: no-store` na API;
- cabeçalhos `X-Content-Type-Options`, `Referrer-Policy` e `Permissions-Policy`;
- HTML escapado no renderizador Markdown;
- protocolos de links restritos;
- service worker sem cache de API;
- nenhuma persistência intencional de screenshots.

## Riscos ainda abertos

- autenticação atual é demonstrativa, não adequada para exposição pública irrestrita;
- a cota da API pertence ao proprietário da chave;
- rate limiting robusto por usuário ainda não está implementado no runtime atual;
- o provedor pode reter dados conforme seus próprios termos e configurações.
