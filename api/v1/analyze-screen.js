import { loadConfig, validateConfig } from '../../src/server/config.js';
import { authorizeRequest } from '../../src/server/auth.js';
import { clientIp, consumeRateLimit } from '../../src/server/rate-limit.js';
import { validateAnalysisInput } from '../../src/server/validation.js';
import { buildExpertPrompt, getExpertProfile, getTaskContract } from '../../src/server/expert-profiles.js';
import { apiError, responseHeaders } from '../../src/server/errors.js';
import { analyzeWithGemini } from '../../src/server/providers/gemini.js';

export const config = { runtime: 'edge' };

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

  const profile = getExpertProfile(input.profileId);
  const task = getTaskContract(input.taskId);
  const prompt = buildExpertPrompt({
    profileId: input.profileId,
    taskId: input.taskId,
    responseMode: input.responseMode,
    question: input.question,
  });

  const result = await analyzeWithGemini({
    config: appConfig,
    image: input.image,
    prompt,
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
      expertProfile: {
        id: profile.id,
        name: profile.name,
        fallbackUsed: input.profileFallbackUsed,
      },
      task: {
        id: task.id,
        fallbackUsed: input.taskFallbackUsed,
      },
      responseMode: input.responseMode,
      image: { sizeBytes: input.image.size },
      release: appConfig.release,
    },
  }), {
    headers: responseHeaders(requestId, appConfig.release, {
      'x-rate-limit-remaining': String(rate.remaining),
    }),
  });
}
