import { loadConfig, validateConfig } from '../../src/server/config.js';
import { authenticateRequest } from '../../src/server/auth.js';
import { clientIp, consumeRateLimit } from '../../src/server/rate-limit.js';
import { apiError, responseHeaders } from '../../src/server/errors.js';
import { ttsInternals } from '../../src/server/providers/gemini-tts.js';

export const config = { runtime: 'edge' };

const API_REVISION = '2026-05-20';

function readText(payload) {
  const text = typeof payload?.text === 'string' ? payload.text.trim() : '';
  return text.replace(/<\/transcricao>/gi, '').replace(/<transcricao>/gi, '');
}

function providerError(status) {
  if (status === 429) {
    return { status: 429, code: 'TTS_RATE_LIMIT', message: 'A cota da voz natural foi atingida temporariamente.' };
  }
  if ([401, 403].includes(status)) {
    return { status: 503, code: 'TTS_KEY_REJECTED', message: 'A voz natural está temporariamente indisponível.' };
  }
  if (status === 404) {
    return { status: 503, code: 'TTS_MODEL_UNAVAILABLE', message: 'O modelo de voz natural não está disponível.' };
  }
  return { status: 503, code: 'TTS_PROVIDER_UNAVAILABLE', message: 'A voz natural está temporariamente indisponível.' };
}

export default async function handler(request) {
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();
  const appConfig = loadConfig();

  if (request.method !== 'POST') {
    return apiError(requestId, appConfig.release, 405, 'METHOD_NOT_ALLOWED', 'Método não permitido.');
  }

  const missingConfig = validateConfig(appConfig);
  if (missingConfig.length) {
    console.error(JSON.stringify({ event: 'tts_stream_configuration_invalid', requestId, missing: missingConfig }));
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
    `speech-stream:${authentication.user.id}:${ip}`,
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

  const transcript = ttsInternals.normalizeTranscript(text, appConfig.maxSpeechChars);
  const providerResponse = await fetch(
    'https://generativelanguage.googleapis.com/v1beta/interactions?alt=sse',
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'text/event-stream',
        'x-goog-api-key': appConfig.geminiApiKey,
        'api-revision': API_REVISION,
      },
      body: JSON.stringify({
        model: appConfig.geminiTtsModel,
        input: ttsInternals.buildPrompt(transcript),
        response_format: {
          type: 'audio',
          mime_type: 'audio/l16',
          delivery: 'inline',
        },
        generation_config: {
          speech_config: [{ voice: appConfig.geminiTtsVoice }],
        },
        stream: true,
      }),
      signal: request.signal,
    },
  );

  if (!providerResponse.ok || !providerResponse.body) {
    const provider = providerError(providerResponse.status);
    const detail = await providerResponse.text().catch(() => '');
    console.error(JSON.stringify({
      event: 'gemini_tts_stream_failure',
      requestId,
      model: appConfig.geminiTtsModel,
      httpStatus: providerResponse.status,
      detail: detail.slice(0, 180),
    }));
    return apiError(requestId, appConfig.release, provider.status, provider.code, provider.message);
  }

  return new Response(providerResponse.body, {
    headers: responseHeaders(requestId, appConfig.release, {
      'content-type': 'text/event-stream; charset=utf-8',
      'cache-control': 'no-store, no-transform',
      'x-accel-buffering': 'no',
      'x-audio-sample-rate': '24000',
      'x-audio-channels': '1',
      'x-audio-sample-width': '2',
      'x-rate-limit-remaining': String(rate.remaining),
    }),
  });
}
