import { loadConfig, validateConfig } from '../../src/server/config.js';
import { authenticateRequest } from '../../src/server/auth.js';
import { clientIp, consumeRateLimit } from '../../src/server/rate-limit.js';
import { apiError, responseHeaders } from '../../src/server/errors.js';
import { synthesizeWithGeminiTts } from '../../src/server/providers/gemini-tts.js';

export const config = { runtime: 'edge' };

function readText(payload) {
  const text = typeof payload?.text === 'string' ? payload.text.trim() : '';
  return text.replace(/<\/transcricao>/gi, '').replace(/<transcricao>/gi, '');
}

export default async function handler(request) {
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();
  const appConfig = loadConfig();

  if (request.method !== 'POST') {
    return apiError(requestId, appConfig.release, 405, 'METHOD_NOT_ALLOWED', 'Método não permitido.');
  }

  const missingConfig = validateConfig(appConfig);
  if (missingConfig.length) {
    console.error(JSON.stringify({ event: 'tts_configuration_invalid', requestId, missing: missingConfig }));
    return apiError(requestId, appConfig.release, 503, 'CONFIG', 'A voz natural está temporariamente indisponível.');
  }

  const authentication = await authenticateRequest(request, appConfig);
  if (authentication.error) {
    return apiError(
      requestId,
      appConfig.release,
      authentication.error.status,
      authentication.error.code,
      authentication.error.message,
    );
  }

  const ip = clientIp(request);
  const rate = consumeRateLimit(
    `speech:${authentication.user.id}:${ip}`,
    { max: appConfig.speechRateLimitMax, windowMs: appConfig.speechRateLimitWindowMs },
  );

  if (!rate.allowed) {
    const retryAfter = Math.max(1, Math.ceil((rate.resetAt - Date.now()) / 1000));
    return apiError(
      requestId,
      appConfig.release,
      429,
      'TTS_RATE_LIMIT_USER',
      'Limite temporário da voz natural atingido. A voz do aparelho continua disponível.',
      { 'retry-after': String(retryAfter) },
    );
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return apiError(requestId, appConfig.release, 400, 'REQUEST_INVALID', 'Dados inválidos.');
  }

  const text = readText(payload);
  if (!text) {
    return apiError(requestId, appConfig.release, 400, 'TTS_TEXT_EMPTY', 'Não há texto disponível para leitura.');
  }
  if (text.length > appConfig.maxSpeechChars) {
    return apiError(
      requestId,
      appConfig.release,
      413,
      'TTS_TEXT_TOO_LONG',
      `A leitura natural aceita até ${appConfig.maxSpeechChars} caracteres por vez.`,
    );
  }

  const result = await synthesizeWithGeminiTts({
    config: appConfig,
    text,
    requestId,
  });

  if (result.error) {
    return apiError(requestId, appConfig.release, result.error.status, result.error.code, result.error.message);
  }

  return new Response(JSON.stringify({
    status: 'success',
    data: {
      requestId,
      audioBase64: result.audioBase64,
      mimeType: result.mimeType,
      sampleRate: result.sampleRate,
      channels: result.channels,
      sampleWidth: result.sampleWidth,
      model: result.model,
      voice: result.voice,
      transcriptChars: result.transcriptChars,
      release: appConfig.release,
    },
  }), {
    headers: responseHeaders(requestId, appConfig.release, {
      'x-rate-limit-remaining': String(rate.remaining),
    }),
  });
}
