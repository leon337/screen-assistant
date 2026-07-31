# Deploy na Vercel

## Projeto atual

```text
Projeto: screen-assistant-preview-20260731
Equipe: PREDIX AI BR
Produção: https://screen-assistant-preview-20260731.vercel.app
```

## Conectar o GitHub

1. abra o projeto na Vercel;
2. acesse **Settings → Git**;
3. selecione **Connect Git Repository**;
4. escolha `leon337/screen-assistant`;
5. mantenha `main` como branch de produção;
6. não defina framework preset;
7. mantenha o diretório raiz vazio;
8. confirme que as variáveis já existentes continuam associadas a Production e Preview.

## Variáveis de ambiente

```env
AI_MODE=gemini
GEMINI_API_KEY=<segredo>
GEMINI_MODEL=gemini-3.5-flash-lite
GEMINI_FALLBACK_MODEL=gemini-3.1-flash-lite
GEMINI_TIMEOUT_MS=25000
```

Somente `GEMINI_API_KEY` precisa ser segredo. As demais podem ser visíveis, embora marcá-las como sensíveis não cause falha.

## Validação após o deploy

```text
GET /
GET /health
GET /ready
```

O `/ready` deve informar:

```json
{
  "status": "success",
  "data": {
    "status": "ready",
    "analysisMode": "gemini",
    "geminiConfigured": true
  }
}
```

## Teste funcional

1. abra a aplicação;
2. escolha câmera, galeria ou captura de tela;
3. confirme a pré-visualização;
4. escreva uma pergunta;
5. clique em **Analisar com Gemini**;
6. confirme resposta, modelo e eventual fallback;
7. teste copiar e ouvir.

## Rollback

Em caso de regressão:

1. abra **Deployments** na Vercel;
2. escolha o último deployment comprovadamente funcional;
3. promova ou faça rollback pelo painel;
4. registre o incidente no GitHub;
5. corrija em branch separada e valide antes de nova promoção.
