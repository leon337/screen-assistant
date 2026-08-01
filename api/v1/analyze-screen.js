import { loadConfig, validateConfig } from '../../src/server/config.js';
import { authorizeRequest } from '../../src/server/auth.js';
import { clientIp, consumeRateLimit } from '../../src/server/rate-limit.js';
import { validateAnalysisInput } from '../../src/server/validation.js';
import { apiError, responseHeaders } from '../../src/server/errors.js';
import { analyzeWithGemini } from '../../src/server/providers/gemini.js';

export const config = { runtime: 'edge' };

function buildPrompt(question) {
  return `Responda em português do Brasil. Descreva somente o que está visível na captura e separe observação direta de qualquer interpretação. Não invente, não complete lacunas e não estime nomes, números, datas, valores, rótulos ou indicadores que estejam pequenos, borrados, parcialmente ocultos ou sem nitidez suficiente. Nesses casos, escreva exatamente "não foi possível confirmar" e indique brevemente qual região da imagem ficou incerta. Não apresente suposições como fatos. Use obrigatoriamente esta estrutura em Markdown: ## Resumo, ## Observação direta, ## Interpretação e, somente quando útil, ## Detalhes técnicos. Mantenha o resumo curto, use listas e separadores quando ajudarem; nunca use HTML. Quando a imagem mostrar gráficos financeiros, limite-se a descrever elementos visuais e dados legíveis, sem garantir tendência futura nem recomendar compra, venda ou aposta. Pergunta: ${question || 'Explique o conteúdo principal.'}`;
}

export default async function handler(request) {
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();
  const appConfig = loadConfig();

  if (request.method !== 'POST') {
    return apiError(requestId, appConfig.release, 405, 'METHOD_NOT_ALLOWED', 'Método não permitido.');
  }

  const missingConfig = validateConfig(appConfig);
  if (missingConfig.length) {
    console.error(JSON.stringify({ event: 'configuration_invalid', requestId, missing: missingConfig }));
    return apiError(requestId, appConfig.release, 503, 'CONFIG', 'Serviço temporariamente indisponível.');
  }

  if (!authorizeRequest(request, appConfig.accessToken)) {
    return apiError(requestId, appConfig.release, 401, 'AUTH_REQUIRED', 'Código de acesso inválido ou ausente.');
  }

  const ip = clientIp(request);
  const rate = consumeRateLimit(ip, { max: appConfig.rateLimitMax, windowMs: appConfig.rateLimitWindowMs });
  if (!rate.allowed) {
    const retryAfter = Math.max(1, Math.ceil((rate.resetAt - Date.now()) / 1000));
    return apiError(
      requestId,
      appConfig.release,
      429,
      'RATE_LIMIT_LOCAL',
      'Limite temporário de análises atingido. Tente novamente em instantes.',
      { 'retry-after': String(retryAfter) },
    );
  }

  let formData;
  try {
    formData = await request.formData();
  } catch {
    return apiError(requestId, appConfig.release, 400, 'REQUEST_INVALID', 'Dados inválidos.');
  }

  const input = validateAnalysisInput(formData, appConfig);
  if (input.error) {
    return apiError(requestId, appConfig.release, input.error.status, input.error.code, input.error.message);
  }

  const result = await analyzeWithGemini({
    config: appConfig,
    image: input.image,
    prompt: buildPrompt(input.question),
    requestId,
  });

  if (result.error) {
    return apiError(requestId, appConfig.release, result.error.status, result.error.code, result.error.message);
  }

  return new Response(JSON.stringify({
    status: 'success',
    data: {
      requestId,
      answer: result.answer,
      provider: 'gemini',
      model: result.model,
      fallback: result.fallback,
      image: { sizeBytes: input.image.size },
      release: appConfig.release,
    },
  }), {
    headers: responseHeaders(requestId, appConfig.release, {
      'x-rate-limit-remaining': String(rate.remaining),
    }),
  });
}
