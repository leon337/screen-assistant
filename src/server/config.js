const integer = (value, fallback, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) => {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
};

const boolean = (value, fallback = false) => {
  if (value === undefined || value === null || value === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(value).trim().toLowerCase());
};

export function loadConfig(env = process.env) {
  return Object.freeze({
    appEnv: String(env.APP_ENV || 'preview').trim(),
    release: String(env.APP_RELEASE || 'phase-17-visible-operational-status').trim(),
    accessControlEnabled: boolean(env.ACCESS_CONTROL_ENABLED, false),
    accessToken: String(env.PREVIEW_ACCESS_TOKEN || '').trim(),
    aiMode: String(env.AI_MODE || 'simulated').trim(),
    geminiApiKey: String(env.GEMINI_API_KEY || '').trim(),
    geminiModel: String(env.GEMINI_MODEL || 'gemini-3.5-flash-lite').trim(),
    geminiFallbackModel: String(env.GEMINI_FALLBACK_MODEL || 'gemini-3.1-flash-lite').trim(),
    geminiTimeoutMs: integer(env.GEMINI_TIMEOUT_MS, 8500, { min: 1000, max: 60000 }),
    maxImageBytes: integer(env.MAX_IMAGE_BYTES, 2 * 1024 * 1024, { min: 1024, max: 10 * 1024 * 1024 }),
    maxQuestionChars: integer(env.MAX_QUESTION_CHARS, 1000, { min: 1, max: 10000 }),
    rateLimitMax: integer(env.RATE_LIMIT_MAX, 20, { min: 1, max: 10000 }),
    rateLimitWindowMs: integer(env.RATE_LIMIT_WINDOW_MS, 60000, { min: 1000, max: 86400000 }),
  });
}

export function validateConfig(config) {
  const missing = [];
  if (config.accessControlEnabled && config.accessToken.length < 16) missing.push('PREVIEW_ACCESS_TOKEN');
  if (config.aiMode !== 'gemini') missing.push('AI_MODE=gemini');
  if (config.geminiApiKey.length < 10) missing.push('GEMINI_API_KEY');
  return missing;
}
