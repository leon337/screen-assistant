import { loadConfig, validateConfig } from '../../src/server/config.js';
import { authenticateRequest } from '../../src/server/auth.js';
import { clientIp, consumeRateLimit } from '../../src/server/rate-limit.js';
import { apiError, responseHeaders } from '../../src/server/errors.js';
import { transcribeCommandWithGemini } from '../../src/server/providers/gemini-command-audio.js';

export const config = { runtime: 'edge' };

const SUPPORTED_AUDIO_TYPES = new Set([
  'audio/webm',
  'audio/ogg',
  'audio/mp4',
  'audio/mpeg',
  'audio/wav',
  'audio/x-wav',
  'audio/aac',
]);

export default async function handler(request) {
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();
  const appConfig = loadConfig();

  if (request.method !== 'POST') {
    return apiError(requestId, appConfig.release, 405, 'METHOD_NOT_ALLOWED', 'Método não permitido.');
  }

  const missingConfig = validateConfig(appConfig);
  if (missingConfig.length) {
    console.error(JSON.stringify({ event: 'voice_command_configuration_invalid', requestId, missing: missingConfig }));
    return apiError(requestId, appConfig.release, 503, 'CONFIG', 'Comandos por voz temporariamente indisponíveis.');
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
    `voice-command:${authentication.user.id}:${ip}`,
    { max: appConfig.voiceCommandRateLimitMax, windowMs: appConfig.voiceCommandRateLimitWindowMs },
  );

  if (!rate.allowed) {
    const retryAfter = Math.max(1, Math.ceil((rate.resetAt - Date.now()) / 1000));
    return apiError(
      requestId,
      appConfig.release,
      429,
      'VOICE_COMMAND_RATE_LIMIT_USER',
      'Limite temporário de comandos por voz atingido.',
      { 'retry-after': String(retryAfter) },
    );
  }

  let formData;
  try {
    formData = await request.formData();
  } catch {
    return apiError(requestId, appConfig.release, 400, 'REQUEST_INVALID', 'Dados inválidos.');
  }

  const audio = formData.get('audio');
  if (!(audio instanceof File) || audio.size === 0) {
    return apiError(requestId, appConfig.release, 400, 'VOICE_COMMAND_AUDIO_REQUIRED', 'Grave um comando antes de enviar.');
  }

  const mimeType = String(audio.type || '').toLowerCase().split(';')[0];
  if (!SUPPORTED_AUDIO_TYPES.has(mimeType)) {
    return apiError(requestId, appConfig.release, 415, 'VOICE_COMMAND_AUDIO_TYPE', 'Formato de áudio não suportado.');
  }

  if (audio.size > appConfig.maxVoiceCommandBytes) {
    return apiError(requestId, appConfig.release, 413, 'VOICE_COMMAND_AUDIO_TOO_LARGE', 'O comando de voz ficou longo demais.');
  }

  const result = await transcribeCommandWithGemini({
    config: appConfig,
    audio,
    requestId,
  });

  if (result.error) {
    return apiError(requestId, appConfig.release, result.error.status, result.error.code, result.error.message);
  }

  return new Response(JSON.stringify({
    status: 'success',
    data: {
      requestId,
      transcript: result.transcript,
      provider: 'gemini',
      model: result.model,
      release: appConfig.release,
    },
  }), {
    headers: responseHeaders(requestId, appConfig.release, {
      'x-rate-limit-remaining': String(rate.remaining),
    }),
  });
}
